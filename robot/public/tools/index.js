/**
 * @typedef {import('playwright').Page} page
 * @typedef {import('./types').pattern} pattern
 * @typedef {import('./types').patternType} patternType
 * @typedef {import('./types').patternShape} patternShape
 * @typedef {import('./types').matchPattern} matchPattern
 * @typedef {import('./types').iteratePatterns} iteratePatterns
 */
const Apify = require('apify');
const pptrTools = require('./pptr');

const {
    tryRequire,
    saveOutput,
    savePageContent,
    saveScreenshot,
    // sendNotification,
} = require('../../tools');

const {
    decrypt,
    decryptObject,
} = require('../../crypto');

const {
    redactObject,
} = require('../../tools/generic');

const log = require('../../logger');
const {TIMEOUTS} = require('../../consts');
const {CustomError} = require('../../errors');
const {getInnerText} = require('../../tools/generic');

const getPageUrl = async page => page.evaluate(() => window.location.href).catch(error => null);
const sortByList = (list, array) => array.sort((a, b) => list.indexOf(a) - list.indexOf(b));

/**
 * Attempts login with provided details and inputs.
 * Either `predicate` or `selectors.verify` is mandatory for checking login result.
 * @param {Object} options
 * @param {Object} options.page
 * @param {Number} [options.timeout = 10 * 1000]
 * @param {Function} [options.predicate]
 * @param {Object} options.selectors
 * @param {String} options.selectors.username
 * @param {String} options.selectors.password
 * @param {String} [options.selectors.submit]
 * @param {String} [options.selectors.verify]
 * @param {Object} options.credentials
 * @param {String} options.credentials.username
 * @param {String} options.credentials.password
 * @returns {Promise<any[]>} Returns an array with all promises of performed actions and the login response at first index
 */
const login = async ({page, timeout, predicate, selectors, credentials: {username, password}}) => {
    if (!predicate || !selectors.verify)
        throw Error('Login input missing predicate or selector for login status verification');

    await page.waitForSelector(selectors.password);
    await page.type(selectors.username, username);
    await page.type(selectors.password, password);
    const promises = [];

    if (predicate) {
        promises.push(page.waitForResponse(predicate, {
            timeout: timeout || TIMEOUTS.ten,
        }));
    }

    if (selectors.verify) {
        promises.push(page.waitForSelector(selectors.verify, {
            timeout: timeout || TIMEOUTS.ten,
        }));
    }

    if (selectors.submit)
        promises.push(page.click(selectors.submit));
    else
        promises.push(page.keyboard.press('Enter'));

    return Promise.all(promises);
};

const handleDialog = async ({type, message}, dialog) => {
    if (dialog.type() === type && dialog.message().includes(message))
        await dialog.dismiss();
};

const searchResult = async ({page, selectors, policyNumber: input}) => {
    await page.waitForSelector(selectors.input);
    await page.type(selectors.input, input);

    if (selectors.button)
        await page.click(selectors.button);
    else
        await page.keyboard.press('Enter');

    return page.waitForSelector(selectors.found).catch(error => null);
};

/** @type {import('./types').matchPattern} */
const matchPattern = async (page, pattern) => preloadMatchPattern(page)(pattern);

/**
 * Curried for use in robot tools preloaded with page
 * @param {page} page
 * @returns {Function}
 */
const preloadMatchPattern = page => async pattern => {
    const excludePattern = async (page, patternShape) => {
        try {
            const $node = await page.$(patternShape.selector);
            await $node.waitForElementState('visible');
            await $node.waitForElementState('stable');
            await $node.waitForElementState('enabled');
            await $node.hover();
        } catch (error) {
            console.log({patternShape});
            log.debug('Element state check failed -> exclude pattern:', patternShape);
            return true;
        }
        log.debug('Element state check passed -> include pattern:', patternShape);
        return false;
    };

    const patternResults = await Promise.allSettled(pattern.map(async patternShape => {
        if (await excludePattern(page, patternShape)) return null;

        patternShape.contents = Array.isArray(patternShape.contents) ?
            patternShape.contents :
            [patternShape.contents];

        const sourceContent = await page.$eval(patternShape.selector, patternShape.function || getInnerText).catch(() => '');
        console.log({patternShape, sourceContent});

        const patternMatch = patternShape.contents
            .some(content => sourceContent.toLowerCase()
                .includes(content.toLowerCase()));

        return patternMatch ? patternShape : null;
    }));

    const [patternMatch = null] = patternResults.map(({status, value}) => value).filter(result => result);

    if (patternMatch) {
        console.log({patternMatch});

        if (patternResults.getError)
            throw patternResults.getError();
    }

    return patternMatch;
};

/** @type {import('./types').iteratePatterns} */
const iteratePatterns = async (page, patterns = {}, patternOrder = []) => preloadIteratePatterns(page)(patterns, patternOrder);

/**
 * Curried for use in robot tools preloaded with page
 * @param {object} page
 * @returns {Function}
 */
const preloadIteratePatterns = page => async (patterns = {}, patternOrder = []) => {
    const patternTypes = sortByList(patternOrder, Object.keys(patterns));

    for (const patternType of patternTypes) {
        console.log({patternType});
        const patternMatch = await matchPattern(page, patterns[patternType]);

        if (patternMatch)
            return patternType;
    }

    log.console.debug('No pattern match found:', patternTypes);
};

const foundSearchPattern = (text, searchPatterns) =>
    searchPatterns.some(searchPattern =>
        text
            .toLowerCase()
            .includes(searchPattern.toLowerCase()));

const verifyResult = ({selector, contents}) => {
    const $element = document.querySelector(selector);

    if (!$element)
        return false;

    const elementText = $element.innerText;

    return (Array.isArray(contents) ? contents : [contents])
        .some(content =>
            elementText.toLowerCase().includes(content.toLowerCase()));
};

module.exports = {
    ...pptrTools,
    log,
    tryRequire,
    login,
    decrypt,
    decryptObject,
    redactObject,
    getPageUrl,
    handleDialog,
    searchResult,
    matchPattern,
    iteratePatterns,
    verifyResult,
    saveOutput,
    saveScreenshot,
    savePageContent,
    foundSearchPattern,
    preloadMatchPattern,
    preloadIteratePatterns,
};
