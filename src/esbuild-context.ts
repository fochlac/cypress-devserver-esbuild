import { context, build, BuildOptions, Plugin, BuildContext } from 'esbuild'

export async function createContext(
  esbuildConfig: BuildOptions = {},
  entryPoints: string[],
  watchMode: boolean,
  plugins: Plugin[] = []
): Promise<BuildContext<BuildOptions> | null> {
  const config: BuildOptions = {
    ...esbuildConfig
  }

  // Remove publicPath if present
  delete (config as any).publicPath

  const finalConfig: BuildOptions = {
    ...config,
    entryPoints,
    bundle: true,
    format: 'esm',
    splitting: esbuildConfig.splitting !== false,
    outbase: esbuildConfig.outbase ?? './',
    outdir: esbuildConfig.outdir ?? '/dist',
    plugins: [...(esbuildConfig.plugins ?? []), ...plugins]
  }

  return watchMode
    ? context(finalConfig).then((ctx) => {
        ctx.watch()
        return ctx
      })
    : build(finalConfig).then(() => null)
}
