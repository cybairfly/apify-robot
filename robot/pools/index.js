const puppeteer = require('puppeteer');
const playwright = require('playwright');
const { utils: { log } } = require('apify');
const { BrowserPool, PuppeteerPlugin, PlaywrightPlugin } = require('browser-pool');

const FingerprintGenerator = require('fingerprint-generator');
const FingerprintInjector = require('@apify-packages/fingerprint-injector');

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

    // if (stealth) {
    //     // TODO dynamically override fpgen options with actual selected browser type
    //     const fingerprintGenerator = new FingerprintGenerator(browserPoolOptions.fpgen);

    //     options.prePageCreateHooks = [
    //         ...options.prePageCreateHooks,
    //         (session => async (pageId, browserController) => {
    //             const fingerprint = session.userData.fingerprint || await fingerprintGenerator.getFingerprint().fingerprint;
    //             log.debug(session.userData.fingerprint ? 'Restoring fingerprint' : 'Fingerprint generated', { fingerprint });
    //             session.userData.fingerprint = session.userData.fingerprint || fingerprint;

    //             const fingerprintInjector = new FingerprintInjector({ fingerprint });
    //             await fingerprintInjector.initialize();

    //             // For now this needs to be set manually to the context.
    //             const context = await browserController.browser.newContext({
    //                 userAgent: fingerprintInjector.fingerprint.userAgent,
    //                 locale: fingerprintInjector.fingerprint.navigator.language,
    //             });

    //             await fingerprintInjector.attachFingerprintToPlaywright(context);
    //         })(session),
    //     ];
    // }

    return new BrowserPool(options);
};

// TODO switch to context from hooks when supported
const getStealthPage = async ({options: {browserPool: browserPoolOptions}, proxyConfig: proxyConfiguration, session, sessionId}) => {
    const proxyUrl = await proxyConfiguration.newUrl(session.id);
    const [browserPlugin] = getBrowserPlugins({...browserPoolOptions, options: {...browserPoolOptions.options, proxyUrl} });
    const fingerprintGenerator = new FingerprintGenerator(browserPoolOptions.fpgen);

    const fingerprint = session.userData.fingerprint || await fingerprintGenerator.getFingerprint().fingerprint;
    log.debug(session.userData.fingerprint ? 'Restoring fingerprint' : 'Fingerprint generated', { fingerprint });
    session.userData.fingerprint = session.userData.fingerprint || fingerprint;

    const fingerprintInjector = new FingerprintInjector({ fingerprint });
    await fingerprintInjector.initialize();

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
    getStealthPage,
};
