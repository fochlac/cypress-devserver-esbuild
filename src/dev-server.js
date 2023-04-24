const { context } = require('esbuild')
const path = require('path')
const express = require('express')
const { readFile, writeFile } = require('fs/promises')
const { readFileSync } = require('fs')

const template = readFileSync(path.join(__dirname, './client-script.js'), 'utf8')

async function buildFiles(esbuildConfig, entryPoints, plugins = [], supportFileInjectPath) {
    if (!esbuildConfig.outdir) {
        throw new Error('[ESBUILD_DEV_SERVER]: Please define an outdir in your esbuild config.')
    }

    return context({
        ...esbuildConfig,
        entryPoints,
        bundle: true,
        format: 'esm',
        splitting: true,
        inject: supportFileInjectPath ? [supportFileInjectPath, ...(esbuildConfig.inject || [])] : esbuildConfig.inject,
        outbase: '/',
        plugins: [...esbuildConfig.plugins, ...plugins]
    })
}

const createDevServer = (esbuildConfig, {hasCssModules} = {}) => async ({ cypressConfig, specs, devServerEvents }) => {
    let started,
        isBuilding = false
    const portPromise = new Promise(resolve => {
        started = port => resolve({ port })
    })

    const supportFileInjectPath = path.join(esbuildConfig.outdir, './head.js')
    if (cypressConfig.supportFile) {
        await writeFile(
            supportFileInjectPath,
            `import '${cypressConfig.supportFile.replaceAll('\\', '\\\\')}'`
        )
    }

    const monitorPlugin = {
        name: 'server',
        setup(build) {
            let done

            build.onStart(() => {
                isBuilding = new Promise(resolve => {
                    done = () => resolve()
                })
            })
            build.onEnd(() => {
                isBuilding = false
                done()
                devServerEvents.emit('dev-server:compile:success')
            })
        }
    }

    let ctx = await buildFiles(
        esbuildConfig,
        specs.map(spec => spec.absolute),
        [monitorPlugin],
        cypressConfig.supportFile ? supportFileInjectPath : null
    )

    ctx.watch()

    // handle new specs / changes to spec pattern
    devServerEvents.on('dev-server:specs:changed', async specs => {
        const oldCtx = ctx
        const newCtx = await buildFiles(
            esbuildConfig,
            specs.map(spec => spec.absolute),
            [monitorPlugin],
            cypressConfig.supportFile ? supportFileInjectPath : null
        )
        newCtx.watch()
        oldCtx.dispose()
    })

    const app = express()

    // wait for build to be finished before serving files
    app.use(async (_req, _res, next) => {
        if (isBuilding) await isBuilding
        next()
    })

    app.get(cypressConfig.devServerPublicPathRoute + '/index.html', async (_req, res) => {
        let html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Cypress App</title>
          </head>
          <body>
            <div data-cy-root style="width: 100%; height: 100%"></div>
          </body>
        </html>`
        try {
            html = await readFile(path.join(cypressConfig.repoRoot, cypressConfig.indexHtmlFile), {
                encoding: 'utf8'
            })    
        }
        catch(e) {
            console.log('[ESBUILD_DEV_SERVER] index.html missing.')
        }
        // inject the kickstart script
        const outString = html.replace('</head>', `<script type="module">window.hasCssModules=${hasCssModules ? 'true' : false};${template}</script></head>`)
        res.status(200).send(outString)
    })

    // serve the dist folder for the main js file and the css
    app.use(cypressConfig.devServerPublicPathRoute, express.static(esbuildConfig.outdir, { fallthrough: true }), (req, res) => {
        console.log('[ESBUILD_DEV_SERVER] Could not match request to url: ', req.url)
        res.status(404).send()
    })

    // serve the dist folder for internal requests, i.e. dynamic imports and css imports
    app.use(express.static(esbuildConfig.outdir))

    app.use('*', (req, res) => {
        console.log('[ESBUILD_DEV_SERVER] Could not match request to url: ', req.url)
        res.status(404).send()
    })

    const server = app.listen(0, () => {
        console.log('[ESBUILD_DEV_SERVER] dev server started on port: ', server.address().port)
        started(server.address().port)
    })

    return portPromise
}

module.exports = {
    createDevServer
}
