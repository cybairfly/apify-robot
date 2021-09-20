/**
 * @typedef {import('apify').Session} Session
 * @typedef {import('apify').ProxyConfiguration} ProxyConfiguration
 *
 * @typedef {import('../types').Robot} Robot
 * @typedef {import('../types').input} input
 * @typedef {import('../types').options} options
 */

const Apify = require('apify');
const path = require('path');
const playwright = require('playwright');

const log = require('../logger');

const tryRequire = {
    local: log => localPath => {
        try {
            log.debug(localPath);
            return require(localPath);
        } catch (error) {
            const [message, ...stack] = error.message.split('\n');
            log.debug(message);
            log.debug(stack);
            return false;
        }
    },
    global: (log, rootPath) => (globalPath, options = {scope: false}) => {
        try {
            const requirePath = path.join(rootPath, globalPath);
            log.join.debug('Require attempt:');
            log.join.debug('ROOT:', rootPath);
            log.join.debug('PATH:', requirePath);
            return require(requirePath);
        } catch (error) {
            const [message] = error.message.split('\n', 1);
            log.debug(message);

            if (options.scope)
                log.debug(error.stack);

            return false;
        }
    },
};

const curryDebug = (input = {}) => page => async name => {
    if (!input.debug) return;
    log.default(' '.repeat(100));
    log.default(`DEBUG [${name || '<anonymous>'}]`);
    log.default('-'.repeat(100));
    await saveScreenshot({name: `DEBUG${name ? `-${name}` : ''}`, page});
    await savePageContent({name: `DEBUG${name ? `-${name}` : ''}`, page});
};

/**
 * Launch standalone browser
 * @param {options} options
 * @param {Session} session
 * @param {ProxyConfiguration} proxyConfig
 * @returns {Promise<*>}
 */
const getBrowser = async ({options, session, proxyConfig}) => {
    const launchContext = options.library.puppeteer ?
        options.launchContext.puppeteer :
        options.launchContext.playwright;

    launchContext.proxyUrl = launchContext.proxyUrl || proxyConfig.newUrl(session.id);

    if (options.library.playwright)
        launchContext.launcher = playwright[options.browser || 'firefox'];

    return options.library.puppeteer ?
        Apify.launchPuppeteer(launchContext) :
        Apify.launchPlaywright(launchContext);
};

const getPage = async options => {
    const browser = await Apify.launchPuppeteer(options.launchPuppeteer);
    const [page] = await browser.pages();
    return page;
};

const getUserAgent = () => {
    const userAgent = Apify.utils.getRandomUserAgent();
    const match = userAgent.includes('AppleWebKit')
        && userAgent.includes('(Windows')
        && userAgent.match('Chrome/[.0-9]* Safari')
        && !userAgent.includes('Edge/')
        && !userAgent.includes('OPR/');

    return match ? userAgent : getUserAgent();
};

const parseDomain = (url, target) => {
    try {
        const parsedUrl = new URL(url);
        url = parsedUrl.hostname;
    } catch (error) {
        url = target;
    }

    // TODO improve domain parsing
    const [fallback, domain] = url.split('.').reverse();

    return domain || fallback;
};

const saveScreenshot = async ({id, name, page, retryCount, store}) => {
    // Cannot take screenshot with 0 width.
    try {
        await page.waitForFunction(() => document.readyState !== 'loading').catch(() => null);
        const screenshotBuffer = await page.screenshot({type: 'jpeg', quality: 70, fullPage: true});
        const fileName = `PAGE-SNAP-${name || (retryCount ? `RETRY_R-${retryCount}` : 'FINAL')}-${id || Date.now()}`;

        if (store)
            await store.setValue(fileName, screenshotBuffer, {contentType: 'image/png'});

        else
            await Apify.setValue(fileName, screenshotBuffer, {contentType: 'image/png'});

        const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
        return `https://api.apify.com/v2/key-value-stores/${storeId}/records/${fileName}`;
    } catch (error) {
        log.debug(error);
        log.warning('Failed to take a screenshot');
    }
};

const savePageContent = async ({id, name, page, retryCount, store}) => {
    try {
        const fileName = `PAGE-HTML-${name || (retryCount ? `RETRY_R-${retryCount}` : 'FINAL')}-${id || Date.now()}`;

        if (store)
            await store.setValue(fileName, await page.content(), {contentType: 'text/html'});

        else
            await Apify.setValue(fileName, await page.content(), {contentType: 'text/html'});

        const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
        return `https://api.apify.com/v2/key-value-stores/${storeId}/records/${fileName}`;
    } catch (error) {
        log.debug(error);
        log.warning('Failed to capture page content');
    }
};

const saveOutput = async ({page, name, input, output: currentOutput, retryCount, store}) => {
    const {id} = input;
    const pageContentUrl = await savePageContent({id, name, page, retryCount, store}) || null;
    const screenshotUrl = await saveScreenshot({id, name, page, retryCount, store}) || null;
    const actorRunUrl = `https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}`;

    const output = {...currentOutput, actorRunUrl, screenshotUrl, pageContentUrl};

    if (store)
        await store.setValue('OUTPUT', JSON.stringify(output), {contentType: 'application/json'});

    else
        await Apify.setValue('OUTPUT', JSON.stringify(output), {contentType: 'application/json'});

    return output;
};

const filterOutput = output => Object.fromEntries(Object.entries(output).filter(([key, value]) => value));

const flushAsyncQueueCurry = queue => async () => Promise.all(queue);

module.exports = {
    tryRequire,
    curryDebug,
    getUserAgent,
    getBrowser,
    getPage,
    parseDomain,
    saveOutput,
    savePageContent,
    saveScreenshot,
    filterOutput,
    flushAsyncQueueCurry,
};
