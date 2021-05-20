const puppeteer = require('puppeteer');
const playwright = require('playwright');
const { BrowserPool, PuppeteerPlugin, PlaywrightPlugin } = require('browser-pool');

const {
    addFingerprintToBrowserController,
    addContextOptionsToPageOptions,
    overrideTheRestOfFingerprint,
} = require('../fpgen/src/hooks');

/**
 * Get browser pool with custom options
 * @param {object} browserPoolOptions
 * @param {object} proxyConfiguration
 * @param {object} session
 * @param {object} stealth
 */
const getBrowserPool = async ({input: {stealth}, options: {browserPool: browserPoolOptions}, proxyConfig: proxyConfiguration, session, sessionId}) => {
    const hooks = initHooks(browserPoolOptions.hooks);

    const options = {
        browserPlugins: [
            ...getBrowserPlugins(browserPoolOptions),
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

    options.preLaunchHooks = [
        ...options.preLaunchHooks,
        async (pageId, launchContext) => {
            // update after upgrade to SDK 1
            // launchContext.proxyUrl = await proxyConfiguration.newUrl(sessionId);
            launchContext.proxyUrl = await proxyConfiguration.newUrl(session.id);
        },
    ];

    if (stealth) {
        options.postLaunchHooks = [...options.postLaunchHooks, addFingerprintToBrowserController(session)];
        options.prePageCreateHooks = [...options.prePageCreateHooks, addContextOptionsToPageOptions];
        options.postPageCreateHooks = [...options.postPageCreateHooks, overrideTheRestOfFingerprint];
    }

    return new BrowserPool(options);
};

const getBrowserPlugins = (browserPoolOptions = {}) => {
    const [browserType] = [...Object.keys(browserPoolOptions.browser).filter(type => type), 'firefox'];

    const browserPlugin = browserPoolOptions.library.puppeteer
        ? new PuppeteerPlugin(puppeteer, browserPoolOptions.options)
        : new PlaywrightPlugin(playwright[browserType], browserPoolOptions.options);

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
};
