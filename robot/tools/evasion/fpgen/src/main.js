const playwright = require('playwright');
const { BrowserPool, PlaywrightPlugin, BrowserControllerContext } = require('browser-pool');
const { addFingerprintToBrowserController, overrideNewPageToUseFingerprint, overrideTheRestOfFingerprint } = require('./hooks');

// log.setLevel(log.LEVELS.DEBUG);

const getBrowserPool = async (pluginOptions = {}, proxyConfiguration, session) => {
    pluginOptions = {
        ...pluginOptions,
        // launchOptions: { headless: false, devtools: false, ignoreDefaultArgs: ['--mute-audio'] },

        // createProxyUrlFunction: async () => await proxyConfiguration.newUrl(session.id),
        createContextFunction: async () => {
            return new BrowserControllerContext({
                proxyUrl: await proxyConfiguration.newUrl(session.id),
                session,
            });
        },
    };

    const playwrightPlugin = new PlaywrightPlugin(playwright.firefox, pluginOptions);

    const browserPool = new BrowserPool({
        browserPlugins: [
            playwrightPlugin,
        ],
        postLaunchHooks: [
            addFingerprintToBrowserController,
            overrideNewPageToUseFingerprint,
        ],
        postPageCreateHooks: [
            overrideTheRestOfFingerprint,
        ],
    });

    return browserPool;
};

module.exports = {
    getBrowserPool,
};
