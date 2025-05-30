const { defineConfig } = require('cypress')
const { join } = require('path')
const { cssModulesPlugin } = require('@asn.aeb/esbuild-css-modules-plugin')
const { createEsbuildDevServer } = require('./dist/dev-server')

const testConfig = {
  outdir: './dist-test',
  plugins: [
    cssModulesPlugin({
      emitCssBundle: {
        filename: 'css-bundle'
      }
    })
  ]
}

module.exports = defineConfig({
  component: {
    specPattern: './cypress/component/*.cy.jsx',
    devServer: createEsbuildDevServer(testConfig, {
      singleBundle: false,
      getCssFilePath: (spec, outdir) => join(outdir, './css-bundle.css')
    })
  }
})
