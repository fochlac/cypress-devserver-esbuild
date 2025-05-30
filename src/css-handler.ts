import { resolve, join, relative } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { CypressSpec, SupportFile, CypressConfig, DevServerOptions } from './types'
import { ensure } from './utils'

export async function handleCssFiles(
  spec: CypressSpec,
  supportFile: SupportFile | undefined,
  cypressConfig: CypressConfig,
  outdir: string,
  hash: string,
  getCssFilePath: DevServerOptions['getCssFilePath'],
  singleBundle: boolean,
  injectHTML: (html: string) => void,
  log: (level: number, ...messages: any[]) => void
): Promise<void> {
  if (typeof getCssFilePath !== 'function') {
    return
  }

  const fileName = join(outdir, `/__bundle/test.${hash}.css`)
  const cssPathResult = getCssFilePath(spec, outdir)
  const cssPath = resolve(Array.isArray(cssPathResult) ? cssPathResult[0] : cssPathResult)
  let css = ''
  const files = Array.isArray(cssPathResult) ? cssPathResult.map((p) => resolve(p)) : [cssPath]

  if (supportFile) {
    const supportCssResult = getCssFilePath(supportFile, outdir)
    const supportCssFiles = Array.isArray(supportCssResult)
      ? supportCssResult.map((p) => resolve(p))
      : [resolve(supportCssResult)]
    files.unshift(...supportCssFiles)
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
