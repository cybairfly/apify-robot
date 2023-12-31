/**
 * @typedef {import('../../types').Robot} Robot
 * @typedef {import('../../types').input} input
 * @typedef {import('../../types').options} options
 */

const puppeteer = require('puppeteer');
const playwright = require('playwright');
const log = require('../../logger/index.js');

const { BrowserPool, PuppeteerPlugin, PlaywrightPlugin } = require('@crawlee/browser-pool');

const FingerprintGenerator = require('fingerprint-generator').FingerprintGenerator;
const {FingerprintInjector} = require('fingerprint-injector');

/**
 * Get browser pool with custom hooks & options
 * @param {import('../../types').Robot}
 */
const getBrowserPool = async ({input: {stealth}, options, proxyConfig: proxyConfiguration, session, sessionId}) => {
    const hooks = initHooks(options.browserPool.hooks);

    const browserPoolOptions = {
        browserPlugins: [
            ...getBrowserPlugins(options),
        ],
        preLaunchHooks: [
            ...hooks.preLaunchHooks,
            ...hooks.browser.before,
        ],
        postLaunchHooks: [
            ...hooks.postLaunchHooks,
            ...hooks.browser.after,
        ],
        prePageCreateHooks: [
            ...hooks.prePageCreateHooks,
            ...hooks.page.before.open,
        ],
        postPageCreateHooks: [
            ...hooks.postPageCreateHooks,
            ...hooks.page.after.open,
        ],
        prePageCloseHooks: [
            ...hooks.prePageCloseHooks,
            ...hooks.page.before.close,
        ],
        postPageCloseHooks: [
            ...hooks.postPageCloseHooks,
            ...hooks.page.after.close,
        ],
    };

    browserPoolOptions.preLaunchHooks.push(async (pageId, launchContext) => {
        if (proxyConfiguration)
            launchContext.proxyUrl = await proxyConfiguration.newUrl(session.id);
    });

    if (stealth) {
        // TODO dynamically override fpgen options with actual selected browser type
        const fingerprintGenerator = new FingerprintGenerator(options.browserPool.fpgen);

        const extendedFingerprint = session.userData.fingerprint || await fingerprintGenerator.getFingerprint();
        // const fingerprint2 = session.userData.fingerprint || await fingerprintGenerator.getFingerprint().fingerprint;
        log.debug(session.userData.fingerprint ? 'Restoring fingerprint' : 'Fingerprint generated', extendedFingerprint);
        session.userData.fingerprint = session.userData.fingerprint || extendedFingerprint;

        const fingerprintInjector = new FingerprintInjector({ fingerprint: extendedFingerprint });

        browserPoolOptions.preLaunchHooks.push((pageId, launchContext) => {
            const { useIncognitoPages, launchOptions } = launchContext;

            if (useIncognitoPages)
                return;

            launchContext.launchOptions = {
                ...launchOptions,
                userAgent: extendedFingerprint.fingerprint.userAgent,
                viewport: {
                    width: extendedFingerprint.fingerprint.screen.width,
                    height: extendedFingerprint.fingerprint.screen.height,
                },

            };
        });

        browserPoolOptions.prePageCreateHooks.push((pageId, browserController, pageOptions) => {
            const { launchContext } = browserController;

            if (launchContext.useIncognitoPages && pageOptions) {
                pageOptions.userAgent = extendedFingerprint.fingerprint.userAgent;
                pageOptions.viewport = {
                    width: extendedFingerprint.fingerprint.screen.width,
                    height: extendedFingerprint.fingerprint.screen.height,
                };
            }
        });

        browserPoolOptions.postPageCreateHooks.push(async (page, browserController) => {
            const { browserPlugin, launchContext } = browserController;

            if (browserPlugin instanceof PlaywrightPlugin) {
                const { useIncognitoPages, isFingerprintInjected } = launchContext;

                // Prevent memory leaks caused by repeated script injection
                if (isFingerprintInjected)
                    return;

                const context = page.context();
                await fingerprintInjector.attachFingerprintToPlaywright(context, extendedFingerprint);

                // Prevent memory leaks caused by repeated script injection
                if (!useIncognitoPages)
                    launchContext.extend({ isFingerprintInjected: true });
            }

            if (browserPlugin instanceof PuppeteerPlugin) {
                await page.setUserAgent(extendedFingerprint.fingerprint.userAgent);
                await page.setViewport({
                    width: extendedFingerprint.fingerprint.screen.width,
                    height: extendedFingerprint.fingerprint.screen.height,
                });

                await fingerprintInjector.attachFingerprintToPuppeteer(page, extendedFingerprint);
            }
        });
    }

    return new BrowserPool(browserPoolOptions);
};

const getStealthPage = async ({options, proxyConfig: proxyConfiguration, session, sessionId}) => {
    const proxyUrl = await proxyConfiguration.newUrl(session.id);
    const [browserPlugin] = getBrowserPlugins({
        ...options,
        browserPool: {
            ...options.browserPool,
            plugins: {
                ...options.browserPool.plugins, proxyUrl,
            },
        },
    });

    const fingerprintGenerator = new FingerprintGenerator(options.browserPool.fpgen);

    const fingerprint = session.userData.fingerprint || await fingerprintGenerator.getFingerprint().fingerprint;
    log.debug(session.userData.fingerprint ? 'Restoring fingerprint' : 'Fingerprint generated', { fingerprint });
    session.userData.fingerprint = session.userData.fingerprint || fingerprint;

    const fingerprintInjector = new FingerprintInjector({ fingerprint });
    const launchContext = browserPlugin.createLaunchContext();
    const browser = await browserPlugin.launch(launchContext);

    // For now this needs to be set manually to the context.
    const context = await browser.newContext({
        userAgent: fingerprintInjector.fingerprint.userAgent,
        locale: fingerprintInjector.fingerprint.navigator.language,
    });

    await fingerprintInjector.attachFingerprintToPlaywright(context);

    return context.newPage();
};

/**
 *
 * @param {options} options
 * @returns {Array<browserPlugin>}
 */
const getBrowserPlugins = (options = {}) => {
    const [browserType] = [...Object.keys(options.browser).filter(type => type), 'firefox'];

    const browserPlugin = options.library.puppeteer
        ? new PuppeteerPlugin(puppeteer, options.browserPool.plugins)
        : new PlaywrightPlugin(playwright[browserType], options.browserPool.plugins);

    return [browserPlugin];
};

const initHooks = hooks => Object
    .entries(hooks)
    .reduce((pool, [key, value]) => ({
        ...pool,
        [key]: value && Object.getPrototypeOf(value) === Object.prototype ?
            initHooks(value) :
            value || [],
    }), {});

module.exports = {
    getBrowserPool,
    getStealthPage,
};
