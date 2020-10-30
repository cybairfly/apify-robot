const Apify = require('apify');
const playwright = require('playwright');
const { BrowserPool, PlaywrightPlugin } = require('browser-pool');
const { addFingerprintToBrowserController, overrideNewPageToUseFingerprint, overrideTheRestOfFingerprint } = require('./hooks');

const { utils: { log } } = Apify;

const LOGIN_URL = 'https://www.disneyplus.com/login';

log.setLevel(log.LEVELS.DEBUG);

Apify.main(async () => {
    const proxyConfiguration = await Apify.createProxyConfiguration({ groups: ['RESIDENTIAL'], countryCode: 'US' });
    const sessionPool = await Apify.openSessionPool({ maxPoolSize: 10 });
    const session = await sessionPool.getSession();

    const pluginOptions = {
        launchOptions: { headless: true },

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

    const page = await browserPool.newPage();

    await page.goto(LOGIN_URL, { timeout: 60000 });

    log.info('Page navigation ended');

    try {
        await page.waitForSelector('#webAppScene');
    } catch (e) {
        throw new Error('Bypassing initial protection unsuccessfull or selector `#webAppScene` does not exist');
    }

    log.info('Successfully bypassed the initial page load protection');

    // No you know everything is good and you can start the automation

    // Automation done

    await page.close(); // not needed if only one page is used from the pool.
});
