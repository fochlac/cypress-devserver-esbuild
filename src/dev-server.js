const { context, build } = require('esbuild')
const { resolve, join } = require('path')
const { readFile, writeFile } = require('fs/promises')
const { createCustomDevServer } = require('cypress-ct-custom-devserver')
const crypto = require('crypto')

async function createContext(esbuildConfig, entryPoints, watchMode, plugins = []) {
    const config = {
        ...esbuildConfig,
        entryPoints,
        bundle: true,
        format: 'esm',
        splitting: esbuildConfig.splitting !== false,
        outbase: esbuildConfig.outbase ?? './',
        outdir: esbuildConfig.outdir ?? '/dist',
        plugins: [...esbuildConfig.plugins, ...plugins]
    }
    
    return watchMode 
        ? context(config).then((ctx) => {
            ctx.watch()
        })
        : build(config).then(() => null)
}

const createEsbuildDevServer = (esbuildConfig, { getCssFilePath, singleBundle, singleBundleConfig, port, additionalEntryPoints, logFunction } = {}) => {
    return createCustomDevServer(async ({ cypressConfig, specs, supportFile, onBuildComplete, onBuildStart, serveStatic }) => {
        const log = (logLevel, ...messages) => typeof logFunction === 'function' && logFunction(logLevel, ...messages)
        const outdir = esbuildConfig.outdir ?? '/dist'
        let markFirstBuildDone
        const firstBuildDone = new Promise((resolve) => {
            markFirstBuildDone = () => resolve()
        })
        const monitorPlugin = {
            name: 'esbuild-dev-server-monitor',
            setup(build) {
                build.onStart(() => {
                    log(5, 'Starting build.')
                    onBuildStart()
                })
                build.onEnd(() => {
                    log(5, 'Building finished.')
                    onBuildComplete()
                    markFirstBuildDone()
                })
            }
        }

        const watchMode = cypressConfig?.watchForFileChanges !== false

        let ctx = await createContext(
            esbuildConfig,
            specs.map(spec => spec.absolute)
                .concat(supportFile ? [supportFile.absolute] : [])
                .concat(Array.isArray(additionalEntryPoints) ? additionalEntryPoints : []),
            watchMode,
            [monitorPlugin]
        )

        serveStatic(outdir)

        await firstBuildDone
        log(5, 'First build completed - starting dev-server.')

        return {
            loadTest: async (spec, { injectHTML, loadBundle }) => {
                const supportPath = supportFile && join(outdir, supportFile.relative.replace(supportFile?.fileExtension, '.js'))
                if (supportFile && !singleBundle) {
                    loadBundle(resolve(supportPath))
                }
                const hash = crypto.createHash('md5').update(testPath).digest('base64url')

                const testPath = join(outdir, spec.relative.replace(spec?.fileExtension, '.js'))
                if (singleBundle) {
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
                        ...(singleBundleConfig || {})
                    })
                    log(3, `Creating bundle took ${Date.now() - now}ms.`)
                    loadBundle(resolve(fileName))
                }
                else {
                    loadBundle(resolve(testPath))
                }

                if (typeof getCssFilePath === 'function') {
                    const fileName = join(outdir, `/__bundle/test.${hash}.css`)
                    const cssPath = resolve(getCssFilePath(spec, outdir))
                    let css = ''
                    const files = Array.isArray(cssPath) ? cssPath : [cssPath]

                    if (supportFile) {
                        const cssPath = resolve(getCssFilePath(supportFile, outdir))
                        files.push(...(Array.isArray(cssPath) ? cssPath : [cssPath]))
                    }

                    for (const file of files) {
                        try {
                            const content = await readFile(file, 'utf8')
                            css += content
                        }
                        catch (e) { }
                    }
                    writeFile(fileName, css, 'utf8')
                    injectHTML(`<link rel="stylesheet" type="text/css" href="$/__bundle/test.${hash}.css" media="all">`)
                }
            },
            onSpecChange: async specs => {
                if (watchMode) {
                    const oldCtx = ctx
                    ctx = await createContext(
                        esbuildConfig,
                        specs.map(spec => spec.absolute)
                            .concat(supportFile ? [supportFile.absolute] : [])
                            .concat(Array.isArray(additionalEntryPoints) ? additionalEntryPoints : []),
                        watchMode,
                        [monitorPlugin]
                    )
                    oldCtx.dispose()
                }
            },
            onClose: () => ctx.dispose(),
            devServerPort: port,
            logFunction: typeof logFunction === 'function' ? log : undefined
        }
    })
}

module.exports = {
    createEsbuildDevServer
}
