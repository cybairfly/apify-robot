const Apify = require('apify');

const {log} = Apify.utils;

const {
    PUPPETEER,
} = require('../../consts');

const {
    CustomError,
} = require('../../errors');

const goto = async (page, url, options = {}) => {
    const response = await page.goto(url, {
        waitUntil: PUPPETEER.events.domcontentloaded,
        ...options,
    });

    const status = response.status();

    if (status >= 400) {
        throw CustomError({
            name: 'Status',
            data: {
                status,
            },
            message: `Page failed to load with status ${status}`,
        });
    }

    return response;
};

const waitFor = async (page, arg, options = {}) => page.waitFor(arg, options);
const waitForSelector = async (page, selector, options = {}) => page.waitForSelector(selector, options);
const waitForNavigation = async (page, options = {}) => page.waitForNavigation(options);
const waitForPageLoad = async page => await page.waitForFunction(() => document.readyState !== 'loading');

module.exports = {
    goto,
    waitFor,
    waitForSelector,
    waitForPageLoad,
    waitForNavigation,
};
