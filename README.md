![CircleCI](https://img.shields.io/circleci/build/github/fochlac/cypress-devserver-esbuild) ![npm](https://img.shields.io/npm/v/cypress-devserver-esbuild)

# cypress-devserver-esbuild

Minimal esbuild dev server for usage with cypress component tests. Tests are packaged as esm-bundles and delivered via a tiny express server.

## Installation
Add the library to your devDependencies
```bash
npm install -D cypress-devserver-esbuild
```

## Usage
Import the `createEsbuildDevServer`-function from `cypress-devserver-esbuild`. As the first parameter pass your esbuild-configuration.
The dev-server will set the entry points and build the tests as esm-bundles with codesplitting. If no outDir is set the devserver will compile the tests into `/dist`.
If you use css-modules and compile them into seperate css-files, you will need to set `hasCssFiles: true`.
If your tests result in too many chunks and the MaxConnectionsPerHost-limit is slowing your tests down you can try to set `singleBundle: true`. This will bundle all the related scripts on demand, however if your test's scope is very wide this might be slow.

```
const { defineConfig } = require("cypress");
const { join } = require("path");
const { cssModulesPlugin } = require("@asn.aeb/esbuild-css-modules-plugin");
const { createEsbuildDevServer } = require("./src/dev-server");

const testConfig = {
  outdir: "./dist-test",
  plugins: [cssModulesPlugin({
    emitCssBundle: {
        filename: 'css-bundle.css'
    }
  })]
};

module.exports = defineConfig({
  component: {
    specPattern: "./cypress/component/*.cy.jsx",
    devServer: createEsbuildDevServer(testConfig, { 
      singleBundle: true, 
      getCssFilePath: (spec, outdir) => join(outdir, './css-bundle.css'),
      port: 1234
    })
  }
});

```

## Options

#### getCssFilePath
*Default: undefined*

If a function is passed, the function will be called to get the path(s) of css files to be included with the test.
The first parameter is the Cypress spec object containing the relative and absolute paths of the test. The second parameter is the output dir.
You can return either a single full path to a css file, or an Array of paths. The content of the css files will be injected in a style-tag at the end of the head of the test's index.html file.

#### singleBundle
*Default: false*

If set to true esbuild will bundle your test and all it's dependencies into a single file. This might slow down the startup of your tests, so check the output for the build-times.

#### port
*Default: 0*

You can set a custom port for the dev-server to run. If no port is provided, the devserver will use a random free port.
