// This file is merged in a <script type=module> into index.html
// it will be used to load and kick start the selected spec

const CypressInstance = (window.Cypress = parent.Cypress)

if (!CypressInstance) {
    throw new Error('Tests cannot run without a reference to Cypress!')
}

function replaceLast(str, search, replace) {
    let idx = str.lastIndexOf(search);
    if (idx >= 0) {
        return str.substring(0, idx) + replace + str.substring(idx + search.length);
    }
    return str
}
 
const devServerPublicPathRoute = CypressInstance.config('devServerPublicPathRoute')
const {relative, fileExtension} = CypressInstance.spec
const normalizedAbsolutePathJs = replaceLast(relative.replace(/^\//, ''), fileExtension, '.js')
const normalizedAbsolutePathCss = replaceLast(relative.replace(/^\//, ''), fileExtension, '.css')

/* Spec file import logic, since we use esm bundles load the js and inject the css */
CypressInstance.onSpecWindow(window, [
    {
        absolute: CypressInstance.spec.absolute,
        load: () => {
            // inject css
            if (window.hasCssModules) {
                fetch(`${devServerPublicPathRoute}/${normalizedAbsolutePathCss}`)
                    .then(r => r.text())
                    .then(css => {
                        const styles = document.createElement('style')
                        styles.innerHTML = css || ''
                        document.getElementsByTagName('head')[0].appendChild(styles)
                    })
                    .catch(e => console.log(e))
            }

            // load js
            return import(`${devServerPublicPathRoute}/${normalizedAbsolutePathJs}`)
        },
        relative: CypressInstance.spec.relative,
        relativeUrl: `${devServerPublicPathRoute}/${normalizedAbsolutePathJs}`
    }
])

// then start the test process
CypressInstance.action('app:window:before:load', window)

// mock process.env and global since our app still relies on this
window.global = window
window.process = typeof process !== 'undefined' ? process : {}
