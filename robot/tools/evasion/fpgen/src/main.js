const playwright = require('playwright');
const { BrowserPool, PlaywrightPlugin, BrowserControllerContext } = require('browser-pool');

const {
    addFingerprintToBrowserController,
    addContextOptionsToPageOptions,
    overrideTheRestOfFingerprint,
} = require('./hooks');

// log.setLevel(log.LEVELS.DEBUG);

const getBrowserPool = async (pluginOptions = {}, proxyConfiguration, session) => {
    const sessionId = session.id;
    console.log({ sessionId });

    const playwrightPlugin = new PlaywrightPlugin(playwright.firefox, pluginOptions);

    const browserPool = new BrowserPool({
        browserPlugins: [
            playwrightPlugin,
        ],
        preLaunchHooks: [
            async (pageId, launchContext) => {
                launchContext.useIncognitoPages = true;
                launchContext.proxyUrl = await proxyConfiguration.newUrl(sessionId);
            },
        ],
        postLaunchHooks: [
            addFingerprintToBrowserController,
        ],
        prePageCreateHooks: [
            addContextOptionsToPageOptions,
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
