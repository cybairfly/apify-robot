const Apify = require('apify');
const playwright = require('playwright');
const { BrowserPool, PlaywrightPlugin } = require('./browser-pool');
const { addFingerprintToBrowserController, overrideNewPageToUseFingerprint, overrideTheRestOfFingerprint } = require('./hooks');

const { utils: { log } } = Apify;

const LOGIN_URL = 'https://www.disneyplus.com/login';

// log.setLevel(log.LEVELS.DEBUG);

const getBrowserPool = async (proxyConfiguration, session) => {
    // const proxyConfiguration = await Apify.createProxyConfiguration({ groups: ['RESIDENTIAL'], countryCode: 'US' });
    // const sessionPool = await Apify.openSessionPool({ maxPoolSize: 10 });
    // const session = await sessionPool.getSession();

    const pluginOptions = {
        launchOptions: { headless: Apify.isAtHome() ? true : false },

        // The sessions are not needed now you can also use any other random id
        createProxyUrlFunction: async () => await proxyConfiguration.newUrl(session.id),
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
    getBrowserPool
}
