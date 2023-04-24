// This file is merged in a <script type=module> into index.html
// it will be used to load and kick start the selected spec

const CypressInstance = (window.Cypress = parent.Cypress)

if (!CypressInstance) {
    throw new Error('Tests cannot run without a reference to Cypress!')
}

const devServerPublicPathRoute = CypressInstance.config('devServerPublicPathRoute')
const normalizedAbsolutePath = CypressInstance.spec.relative.replace(/^\//, '')

const testFileAbsolutePathRoute = `${devServerPublicPathRoute}/${normalizedAbsolutePath}`

/* Spec file import logic, since we use esm bundles load the js and inject the css */
CypressInstance.onSpecWindow(window, [
    {
        absolute: CypressInstance.spec.absolute,
        load: () => {
            // inject css
            const styles = document.createElement('link')
            styles.rel = 'stylesheet'
            styles.type = 'text/css'
            styles.href = testFileAbsolutePathRoute.replace(/.js$/, '.css')
            document.getElementsByTagName('head')[0].appendChild(styles)

            // load js
            return import(testFileAbsolutePathRoute)
        },
        relative: CypressInstance.spec.relative,
        relativeUrl: testFileAbsolutePathRoute
    }
])

// then start the test process
CypressInstance.action('app:window:before:load', window)

// mock process.env and global since our app still relies on this
window.global = window
window.process = typeof process !== 'undefined' ? process : {}
