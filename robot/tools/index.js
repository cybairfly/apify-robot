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
            log.debug('Require attempt:');
            log.debug('ROOT:', rootPath);
            log.debug('PATH:', requirePath);
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
    console.log(' '.repeat(100));
    console.log(`DEBUG [${name || '<anonymous>'}]`);
    console.log('-'.repeat(100));
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

const flushAsyncQueueCurry = queue => async () => Promise.all(queue);

module.exports = {
    tryRequire,
    curryDebug,
    getUserAgent,
    getBrowser,
    getPage,
    parseDomain,
    flushAsyncQueueCurry,
};
