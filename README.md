[![CircleCI](https://dl.circleci.com/status-badge/img/gh/fochlac/cypress-devserver-esbuild/tree/main.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/fochlac/cypress-devserver-esbuild/tree/main) [![npm](https://img.shields.io/npm/v/cypress-devserver-esbuild)](https://www.npmjs.com/package/cypress-devserver-esbuild)

# cypress-devserver-esbuild

Minimal esbuild dev server for usage with cypress component tests. Tests are packaged as esm-bundles and delivered via a tiny express server.

<br />

## Installation
Add the library to your devDependencies
```bash
npm install -D cypress-devserver-esbuild
```

<br />

## Usage

Import the `createEsbuildDevServer`-function from `cypress-devserver-esbuild`. As the first parameter pass your esbuild-configuration.
The dev-server will set the entry points and build the tests as esm-bundles with codesplitting. If no outDir is set the devserver will compile the tests into `/dist`.
If you use css-modules and compile them into separate css-files, you will need to set `hasCssFiles: true`.
If your tests result in too many chunks and the MaxConnectionsPerHost-limit is slowing your tests down you can first try to explicitly set `splitting: false` in your esbuild config. If this is too slow you can also try to set `singleBundle: true`. This will bundle all the related scripts on demand, however if your test's scope is very wide this might be slow as well.

```js
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

## Dev Server Parameters

<br />

## Esbuild Config

The first parameter is your esbuild config. Please note that some parameters are overwritten by the dev-server:

|Option|Value|Note|
|---|---|---|
|entryPoints  |supportFile, test1, test2, ... |List of paths to all tests + the support file|
|bundle       |true                           |bundle needs to be true to be able to load tests with an import|
|format       |'esm'                          |format needs to be esm to be able to use code splitting and for imports to work|
|splitting    |*true*                         |splitting defaults to true, as it's much faster during build-time|
|outbase      |*'./'*                         |outbase should be set so the folder structure is preserved and tests can be consistenly accessed|
|outdir       |*'./dist'*                     |outdir is required for splitting|

*Note: Italic values are overwriteable*

<br />

## Options

#### additionalEntryPoints
*Default: undefined*

You can add a list of additional entry points to be build if needed. The array will be directly merged to the esbuild config building your tests.


#### getCssFilePath
*Default: undefined*

If a function is passed, the function will be called to get the path(s) of css files to be included with the test.
The first parameter is the Cypress spec object containing the relative and absolute paths of the test. The second parameter is the output dir.
You can return either a single full path to a css file, or an Array of paths. The content of the css files will be injected in a style-tag at the end of the head of the test's index.html file.

#### singleBundle
*Default: false*

If set to true esbuild will bundle your test and all it's dependencies into a single file. This might slow down the startup of your tests, so check the output for the build-times.

#### singleBundleConfig
*Default: undefined*

Additional esbuild-config parameters for the esbuild-job used to merge files into a single bundle.

#### port
*Default: 0*

#### logFunction

You can provide a log function. The first parameter of the function is the loglevel, ranging from 1 to 6 with 1 being critical errors and 6 debug information. A reasonable default might be to log output <= 3. All following parameters are part of the log message.
