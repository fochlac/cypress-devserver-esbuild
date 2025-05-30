import { join } from 'path'
import { build } from 'esbuild'
import * as crypto from 'crypto'
import { CypressSpec, SupportFile, LoadTestParams, DevServerOptions, CypressConfig } from './types'
import { handleCssFiles } from './css-handler'

export async function createTestLoader(
  esbuildConfig: any,
  outdir: string,
  supportFile: SupportFile | undefined,
  cypressConfig: CypressConfig,
  singleBundle: boolean,
  singleBundleConfig: DevServerOptions['singleBundleConfig'],
  getCssFilePath: DevServerOptions['getCssFilePath'],
  log: (level: number, ...messages: any[]) => void
) {
  return async (spec: CypressSpec, { injectHTML, loadBundle }: LoadTestParams) => {
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
        inject: supportPath ? [supportPath] : undefined,
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

    await handleCssFiles(spec, supportFile, cypressConfig, outdir, hash, getCssFilePath, singleBundle, injectHTML, log)
  }
}
