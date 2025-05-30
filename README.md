[![CircleCI](https://dl.circleci.com/status-badge/img/gh/fochlac/cypress-devserver-esbuild/tree/main.svg?style=shield)](https://dl.circleci.com/status-badge/redirect/gh/fochlac/cypress-devserver-esbuild/tree/main) [![npm](https://img.shields.io/npm/v/cypress-devserver-esbuild)](https://www.npmjs.com/package/cypress-devserver-esbuild)

# cypress-devserver-esbuild

Minimal esbuild dev server for usage with cypress component tests. Tests are packaged as esm-bundles and delivered via a tiny express server. Written in TypeScript with full type definitions included.

<br />

## Installation

Add the library to your devDependencies

```bash
npm install -D cypress-devserver-esbuild
```

<br />

## Compatibility

| cypress-devserver-esbuild Version | Cypress Version   | Notes                                                                 |
| --------------------------------- | ----------------- | --------------------------------------------------------------------- |
| 1.0.x - 1.4.x                     | ^12.0.0 - ^13.x.x | Initial releases supporting Cypress 12 and 13                         |
| 1.5.x+                            | ^12.0.0 - ^14.x.x | Added support for Cypress 14 while maintaining backward compatibility |

**Requirements:**

- **Cypress:** Version 12 or higher is required for all versions
- **esbuild:** Version 0.17.0 or higher is required as a peer dependency
  - Minimum supported: `^0.17.0`
  - Tested up to: `^0.25.5` (latest as of 2025)
- **Node.js:** Version 16 or higher recommended
- Starting from version 1.5.0, Cypress 14 is also supported

<br />

## Usage

Import the `createEsbuildDevServer`-function from `cypress-devserver-esbuild`. As the first parameter pass your esbuild-configuration.
The dev-server will set the entry points and build the tests as esm-bundles with codesplitting. If no outDir is set the devserver will compile the tests into `/dist`.
If you use css-modules and compile them into separate css-files, you will need to set `hasCssFiles: true`.
If your tests result in too many chunks and the MaxConnectionsPerHost-limit is slowing your tests down you can first try to explicitly set `splitting: false` in your esbuild config. If this is too slow you can also try to set `singleBundle: true`. This will bundle all the related scripts on demand, however if your test's scope is very wide this might be slow as well.
This lib assumes the cypress-config is placed in the project's root-folder.

```js
const { defineConfig } = require('cypress')
const { join } = require('path')
const { cssModulesPlugin } = require('@asn.aeb/esbuild-css-modules-plugin')
const { createEsbuildDevServer } = require('./src/dev-server')

const testConfig = {
  outdir: './dist-test',
  plugins: [
    cssModulesPlugin({
      emitCssBundle: {
        filename: 'css-bundle.css'
      }
    })
  ]
}

module.exports = defineConfig({
  component: {
    specPattern: './cypress/component/*.cy.jsx',
    devServer: createEsbuildDevServer(testConfig, {
      singleBundle: true,
      getCssFilePath: (spec, outdir) => join(outdir, './css-bundle.css'),
      port: 1234
    })
  }
})
```

## Dev Server Parameters

<br />

## Esbuild Config

The first parameter is your esbuild config. Please note that spec-pattern is resolved using globby which accepts different patterns compared to esbuild, so [only glob-patterns supported by globby](https://github.com/sindresorhus/globby?tab=readme-ov-file#globbing-patterns) will work.
Also the following parameters are overwritten by the dev-server:

| Option      | Value                          | Note                                                                                             |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| entryPoints | supportFile, test1, test2, ... | List of paths to all tests + the support file                                                    |
| bundle      | true                           | bundle needs to be true to be able to load tests with an import                                  |
| publicPath  | null                           | public paths are not required for cypress tests and setting one will cause the test to break     |
| format      | 'esm'                          | format needs to be esm to be able to use code splitting and for imports to work                  |
| splitting   | _true_                         | splitting defaults to true, as it's much faster during build-time                                |
| outbase     | _'./'_                         | outbase should be set so the folder structure is preserved and tests can be consistenly accessed |
| outdir      | _'./dist'_                     | outdir is required for splitting                                                                 |

_Note: Italic values are overwriteable_

<br />

## Options

#### additionalEntryPoints

_Default: undefined_

You can add a list of additional entry points to be build if needed. The array will be directly merged to the esbuild config building your tests.

#### getCssFilePath

_Default: undefined_

If a function is passed, the function will be called to get the path(s) of css files to be included with the test.
The first parameter is the Cypress spec object containing the relative and absolute paths of the test. The second parameter is the output dir.
You can return either a single full path to a css file, or an Array of paths. The content of the css files will be injected in a style-tag at the end of the head of the test's index.html file.

#### singleBundle

_Default: false_

If set to true esbuild will bundle your test and all it's dependencies into a single file. This might slow down the startup of your tests, so check the output for the build-times.

#### singleBundleConfig

_Default: undefined_

Additional esbuild-config parameters for the esbuild-job used to merge files into a single bundle.

#### port

_Default: 0_

#### logFunction

You can provide a log function. The first parameter of the function is the loglevel, ranging from 1 to 6 with 1 being critical errors and 6 debug information. A reasonable default might be to log output <= 3. All following parameters are part of the log message.
