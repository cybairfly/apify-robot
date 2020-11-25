const Apify = require('apify');

const {log} = Apify.utils;

const {
    TIMEOUTS,
} = require('../../consts');

const {
    OUTPUTS,
} = require('../../setup');

const {
    CustomError,
} = require('../../errors');

const {
    saveScreenshot,
} = require('../../tools');

const getPageUrl = async page => await page.evaluate(() => window.location.href);
const sortByList = (list, array) => array.sort((a, b) => list.indexOf(a) - list.indexOf(b));

const login = async ({page, timeout, predicate, selectors, credentials: {username, password}}) => {
    await page.waitForSelector(selectors.password);
    await page.type(selectors.username, username);
    await page.type(selectors.password, password);
    const promises = [];

    if (predicate) {
        promises.push(page.waitForResponse(predicate, {
            timeout: timeout || TIMEOUTS.ten,
        }));
    }

    if (selectors.loggedIn) {
        promises.push(page.waitForSelector(selectors.loggedIn, {
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

const searchPolicyNumber = async ({page, selectors, policyNumber}) => {
    await page.waitForSelector(selectors.input);
    await page.type(selectors.input, policyNumber);

    if (selectors.button)
        await page.click(selectors.button);
    else
        await page.keyboard.press('Enter');

    return await page.waitForSelector(selectors.found, {
        timeout: TIMEOUTS.half,
    }).catch(error => null);
};

const matchPattern = async (page, patterns) => {
    const getInnerText = node => node.innerText;

    const evaluatedPatterns = await Promise.all(patterns.map(async pattern => ({
        ...pattern,
        sourceContent: await page.$eval(pattern.selector, pattern.function || getInnerText).catch(() => ''),
    })));

    const patternMatch = evaluatedPatterns.find(pattern => {
        console.log({pattern});

        return pattern.contents
            .find(content => pattern.sourceContent
                .toLowerCase()
                .includes(content
                    .toLowerCase()));
    });

    if (patternMatch)
        console.log({patternMatch});

    return patternMatch;
};

/**
 *
 * @param {object} page
 * @param {object} patternGroups
 * @param {array} patternOrder
 * @returns {string}
 */
const iteratePatterns = async (page, patternGroups = {}, patternOrder = []) => {
    const patternTypes = sortByList(patternOrder, Object.keys(patternGroups));

    for (const patternType of patternTypes) {
        console.log({patternType});
        const patternMatch = await matchPattern(page, patternGroups[patternType]);

        if (patternMatch)
            return patternType;
    }

    return null;

    // const outputMatches = await Promise.all(patternTypes.map(async patternType => {
    //     const patternMatch = await matchPattern(page, patternGroups[patternType]);
    //
    //     if (patternMatch)
    //         console.log({patternMatch});
    //
    //     return patternMatch ? OUTPUTS[patternType] : null
    // }));
    //
    // const [outputMatch] = outputMatches.filter(x => x);
    //
    // return outputMatch;
};

const foundSearchPattern = (text, searchPatterns) =>
    searchPatterns.some(searchPattern =>
        text
            .toLowerCase()
            .includes(searchPattern.toLowerCase()));

const verifyResult = (selector, contents) => {
    const $element = document.querySelector(selector);

    if (!$element)
        return false;

    const elementText = $element.innerText;

    return (Array.isArray(contents) ? contents : [contents])
        .some(content =>
            elementText.toLowerCase().includes(content.toLowerCase()));
};

module.exports = {
    login,
    getPageUrl,
    handleDialog,
    searchPolicyNumber,
    foundSearchPattern,
    matchPattern,
    iteratePatterns,
    verifyResult,
    saveScreenshot,
};
