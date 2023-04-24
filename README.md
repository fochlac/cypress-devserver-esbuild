# esbuild-dev-server

minimal esbuild dev server for usage with cypress component tests

## Usage
```
const { defineConfig } = require('cypress')
const path = require('path')

const esbuildConfig = {
  outdir: path.resolve('./some-folder')
}

const config = defineConfig({
    component: {
        devServer: createDevServer(esbuildConfig),
        indexHtmlFile: './test/cypress/setup/cypress-index.html',
        supportFile: './test/cypress/support/index.js',
    }
})
```
