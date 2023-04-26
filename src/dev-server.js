const { context, build } = require('esbuild')
const { resolve, join } = require('path')
const { readFile } = require('fs/promises')
const { createCustomDevServer } = require('cypress-ct-custom-devserver')
const crypto = require('crypto')

async function createContext(esbuildConfig, entryPoints, plugins = []) {
    return context({
        ...esbuildConfig,
        entryPoints,
        bundle: true,
        format: 'esm',
        splitting: true,
        outbase: esbuildConfig.outbase ?? '/',
        outdir: esbuildConfig.outdir ?? '/dist',
        plugins: [...esbuildConfig.plugins, ...plugins]
    })
}

const createEsbuildDevServer = (esbuildConfig, { getCssFilePath, singleBundle, port } = {}) => createCustomDevServer(async ({ specs, supportFile, onBuildComplete, onBuildStart, serveStatic }) => {
    const outdir = esbuildConfig.outdir ?? '/dist'
    const monitorPlugin = {
        name: 'server',
        setup(build) {
            build.onStart(onBuildStart)
            build.onEnd(onBuildComplete)
        }
    }

    let ctx = await createContext(
        esbuildConfig,
        specs.map(spec => spec.absolute).concat(supportFile ? [supportFile.absolute] : []),
        [monitorPlugin]
    )

    ctx.watch()

    serveStatic(outdir)

    return {
        loadTest: async (spec, { injectHTML, loadBundle }) => {
            const supportPath = supportFile && join(outdir, supportFile.relative.replace(supportFile?.fileExtension, '.js'))
            if (supportFile && !singleBundle) {
                loadBundle(resolve(supportPath))
            }

            const testPath = join(outdir, spec.relative.replace(spec?.fileExtension, '.js'))
            if (singleBundle) {
                const hash = crypto.createHash('md5').update(testPath).digest('base64url')
                const now = Date.now()
                const fileName = join(outdir, `/__bundle/test.${hash}.js`)
                await build({
                    entryPoints: [testPath],
                    inject: [supportPath],
                    bundle: true,
                    allowOverwrite: true,
                    platform: 'neutral',
                    target: esbuildConfig.target,
                    outfile: fileName,
                })
                console.log(`[ESBUILD_DEV_SERVER] Creating bundle took ${Date.now() - now}ms.`)
                loadBundle(resolve(fileName))
            }
            else {
                loadBundle(resolve(testPath))
            }

            if (typeof getCssFilePath === 'function') {
                const cssPath = resolve(getCssFilePath(spec, outdir))
                let css = ''
                const files = Array.isArray(cssPath) ? cssPath : [cssPath]
                for (const file in files) {
                    try {
                        const content = await readFile(cssPath, 'utf8')
                        css += content
                    }
                    catch (e) { }
                }
                injectHTML(`<style>${css}</style>`)
            }
        },
        onSpecChange: async specs => {
            const oldCtx = ctx
            const newCtx = await createContext(
                esbuildConfig,
                specs.map(spec => spec.absolute).concat(supportFile ? [supportFile.absolute] : []),
                [monitorPlugin]
            )
            newCtx.watch()
            oldCtx.dispose()
        },
        onClose: () => ctx.dispose(),
        devServerPort: port
    }
})

module.exports = {
    createEsbuildDevServer
}
