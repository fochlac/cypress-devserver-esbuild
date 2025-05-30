import { Plugin } from 'esbuild'
import { createCustomDevServer } from 'cypress-ct-custom-devserver'
import { DevServerOptions, CreateCustomDevServerParams, CypressSpec, BuildOptions } from './types'
import { hasStringArrayContentChanged } from './utils'
import { createContext } from './esbuild-context'
import { createTestLoader } from './test-loader'

const createEsbuildDevServer = (esbuildConfig: BuildOptions, options: DevServerOptions = {}) => {
  const { getCssFilePath, singleBundle, singleBundleConfig, port, additionalEntryPoints, logFunction } = options

  return createCustomDevServer(
    async ({
      cypressConfig,
      specs,
      supportFile,
      onBuildComplete,
      onBuildStart,
      serveStatic
    }: CreateCustomDevServerParams) => {
      const log = (logLevel: number, ...messages: any[]): void => {
        if (typeof logFunction === 'function') {
          logFunction(logLevel, ...messages)
        }
      }

      const outdir = esbuildConfig.outdir ?? '/dist'
      let markFirstBuildDone: () => void
      const firstBuildDone = new Promise<void>((resolve) => {
        markFirstBuildDone = () => resolve()
      })

      const monitorPlugin: Plugin = {
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
          .map((spec: CypressSpec) => spec.absolute)
          .concat(supportFile ? [supportFile.absolute] : [])
          .concat(Array.isArray(additionalEntryPoints) ? additionalEntryPoints : []),
        watchMode,
        [monitorPlugin]
      )

      serveStatic(outdir)

      await firstBuildDone
      log(5, 'First build completed - starting dev-server.')

      let lastSpecs = specs.map((spec: CypressSpec) => spec.relative)

      const loadTest = await createTestLoader(
        esbuildConfig,
        outdir,
        supportFile,
        cypressConfig,
        singleBundle ?? false,
        singleBundleConfig,
        getCssFilePath,
        log
      )

      return {
        loadTest,
        onSpecChange: async (specs: CypressSpec[]) => {
          const currentSpecs = specs.map((spec: CypressSpec) => spec.relative)
          if (watchMode && hasStringArrayContentChanged(lastSpecs, currentSpecs)) {
            lastSpecs = currentSpecs
            if (ctx) {
              await ctx.dispose()
            }
            ctx = await createContext(
              esbuildConfig,
              specs
                .map((spec: CypressSpec) => spec.absolute)
                .concat(supportFile ? [supportFile.absolute] : [])
                .concat(Array.isArray(additionalEntryPoints) ? additionalEntryPoints : []),
              watchMode,
              [monitorPlugin]
            )
          }
        },
        onClose: () => ctx?.dispose(),
        devServerPort: port,
        logFunction: typeof logFunction === 'function' ? log : undefined
      }
    }
  )
}

export { createEsbuildDevServer }
