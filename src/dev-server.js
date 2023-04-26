const { context } = require('esbuild')
const path = require('path')
const { readFile } = require('fs/promises')
const { createCustomDevServer } = require('cypress-ct-custom-devserver')

async function createContext(esbuildConfig, entryPoints, plugins = []) {
    if (!esbuildConfig.outdir) {
        throw new Error('[ESBUILD_DEV_SERVER]: Please define an outdir in your esbuild config.')
    }

    return context({
        ...esbuildConfig,
        entryPoints,
        bundle: true,
        format: 'esm',
        splitting: true,
        outbase: '/',
        plugins: [...esbuildConfig.plugins, ...plugins]
    })
}

const createDevServer = (esbuildConfig, { hasCssFiles } = {}) => createCustomDevServer(async ({ specs, supportFile, onBuildComplete, onBuildStart, serveStatic }) => {
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

    serveStatic(esbuildConfig.outdir)

    return {
        loadTest: async (spec, { injectHTML, loadBundle }) => {
            if (supportFile) {
                const supportPath = path.resolve(path.join(esbuildConfig.outdir, supportFile.relative.replace(supportFile?.fileExtension, '.js')))
                loadBundle(supportPath)

            }

            const testPath = path.resolve(path.join(esbuildConfig.outdir, spec.relative.replace(spec?.fileExtension, '.js')))
            loadBundle(testPath)

            if (hasCssFiles) {
                const cssPath = path.resolve(path.join(esbuildConfig.outdir, spec.relative.replace(spec?.fileExtension, '.css')))
                try {
                    const css = await readFile(cssPath, 'utf8')
                    injectHTML(`<style>${css}</style>`)
                }
                catch (e) { }
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
        onClose: () => ctx.dispose()
    }
})

module.exports = {
    createDevServer
}
