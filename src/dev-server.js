const { context, build } = require('esbuild')
const { resolve, join, relative } = require('path')
const { readFile, writeFile, mkdir } = require('fs/promises')
const { createCustomDevServer } = require('cypress-ct-custom-devserver')
const crypto = require('crypto')

const ensure = async (dir, log) => {
  try {
    await access(dir)
  } catch (e) {
    log(4, `Creating dir "${dir}".`)
    try {
      await mkdir(dir)
    } catch (e) {
      log(4, `Error creating dir "${e.message}".`)
    }
  }
}

const hasStringArrayContentChanged = (oldList, newList) => {
  return oldList.length !== newList.length || new Set([].concat(oldList, newList)).size !== oldList.length
}

async function createContext({ ...esbuildConfig } = {}, entryPoints, watchMode, plugins = []) {
  delete esbuildConfig.publicPath
  
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
        return ctx
      })
    : build(config).then(() => null)
}

const createEsbuildDevServer = (
  esbuildConfig,
  { getCssFilePath, singleBundle, singleBundleConfig, port, additionalEntryPoints, logFunction } = {}
) => {
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
      specs
        .map((spec) => spec.absolute)
        .concat(supportFile ? [supportFile.absolute] : [])
        .concat(Array.isArray(additionalEntryPoints) ? additionalEntryPoints : []),
      watchMode,
      [monitorPlugin]
    )

    serveStatic(outdir)

    await firstBuildDone
    log(5, 'First build completed - starting dev-server.')

    let lastSpecs = specs.map(spec => spec.relative)

    return {
      loadTest: async (spec, { injectHTML, loadBundle }) => {
        if (supportFile && !singleBundle) {
          loadBundle(supportFile.relative.replace(supportFile?.fileExtension, '.js'))
        }
        const testPath = spec.relative.replace(spec?.fileExtension, '.js')
        const hash = crypto.createHash('md5').update(testPath).digest('base64url')

        if (singleBundle) {
          const now = Date.now()
          const publicPath = `/__bundle/test.${hash}.js`
          const fileName = join(outdir, publicPath)
          const supportPath = supportFile && join(outdir, supportFile.relative.replace(supportFile?.fileExtension, '.js'))
          await build({
            entryPoints: [join(outdir, testPath)],
            inject: [supportPath],
            bundle: true,
            allowOverwrite: true,
            platform: 'neutral',
            target: esbuildConfig.target,
            outfile: fileName,
            ...(singleBundleConfig || {})
          })
          log(3, `Creating bundle took ${Date.now() - now}ms.`)
          loadBundle(publicPath)
        } else {
          loadBundle(testPath)
        }

        if (typeof getCssFilePath === 'function') {
          const fileName = join(outdir, `/__bundle/test.${hash}.css`)
          const cssPath = resolve(getCssFilePath(spec, outdir))
          let css = ''
          const files = Array.isArray(cssPath) ? cssPath : [cssPath]

          if (supportFile) {
            const cssPath = resolve(getCssFilePath(supportFile, outdir))
            files.unshift(...(Array.isArray(cssPath) ? cssPath : [cssPath]))
          }

          if (singleBundle) {
            for (const file of files) {
              try {
                const content = await readFile(file, 'utf8')
                css += content
              } catch (e) {}
            }
            await ensure(outdir, log)
            await ensure(join(outdir, '__bundle'), log)
            await writeFile(fileName, css, 'utf8')
            injectHTML(
              `<link rel="stylesheet" type="text/css" href="${cypressConfig?.devServerPublicPathRoute}/__bundle/test.${hash}.css" media="all">`
            )
          } else {
            for (const file of files) {
              const relativePath = relative(outdir, file)
              if (relativePath.startsWith('..')) {
                throw new Error('CSS-files need to be inside the out-dir or bundled using the `singleBundle` option.')
              }
              injectHTML(
                `<link rel="stylesheet" type="text/css" href="${cypressConfig?.devServerPublicPathRoute}/${relativePath}" media="all">`
              )
            }
          }
        }
      },
      onSpecChange: async (specs) => {
        const currentSpecs = specs.map(spec => spec.relative)
        if (watchMode && hasStringArrayContentChanged(lastSpecs, currentSpecs)) {
          lastSpecs = currentSpecs
          await ctx.dispose()
          ctx = await createContext(
            esbuildConfig,
            specs
              .map((spec) => spec.absolute)
              .concat(supportFile ? [supportFile.absolute] : [])
              .concat(Array.isArray(additionalEntryPoints) ? additionalEntryPoints : []),
            watchMode,
            [monitorPlugin]
          )
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
