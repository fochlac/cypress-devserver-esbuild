import { BuildOptions as EsbuildBuildOptions } from 'esbuild'

export type BuildOptions = EsbuildBuildOptions

export interface CypressSpec {
  absolute: string
  relative: string
  fileExtension: string
}

export interface SupportFile {
  absolute: string
  relative: string
  fileExtension: string
}

export interface CypressConfig {
  watchForFileChanges?: boolean
  devServerPublicPathRoute?: string
}

export interface DevServerOptions {
  getCssFilePath?: (spec: CypressSpec, outdir: string) => string | string[]
  singleBundle?: boolean
  singleBundleConfig?: BuildOptions
  port?: number
  additionalEntryPoints?: string[]
  logFunction?: (logLevel: number, ...messages: any[]) => void
}

export interface CreateCustomDevServerParams {
  cypressConfig: CypressConfig
  specs: CypressSpec[]
  supportFile?: SupportFile
  onBuildComplete: () => void
  onBuildStart: () => void
  serveStatic: (path: string) => void
}

export interface LoadTestParams {
  injectHTML: (html: string) => void
  loadBundle: (bundlePath: string) => void
}
