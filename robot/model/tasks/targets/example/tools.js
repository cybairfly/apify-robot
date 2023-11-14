const Robot = require('apify-robot');

const { matchPattern } = Robot.tools;
const { SELECTORS } = require('./config');
const { parseAndFormatDateString } = require('../../../tools');

const handleMissingResponse = page => async error => {
    const isConnectionError = await matchPattern(page, [{
        selector: SELECTORS.loginErrorMessage,
        contents: ['experiencing slow internet connection'],
    }]);

    if (isConnectionError)
        throw new Robot.errors.Network({retry: true});

    const isTimeoutError = error.message.includes('TimeoutError: page.waitForResponse');
    if (isTimeoutError)
        throw new Robot.errors.timeout.Response({error, retry: true, rotateSession: true});

    throw error;
};

const extractDate = async (page, selector) => {
    const endDateText = await page.$eval(selector, node => node.innerText).catch(() => {});
    if (endDateText) {
        const endDateMatch = endDateText.match(/You may continue to watch Disney\+ until ([\w\s,]+)/);
        if (endDateMatch)
            return parseAndFormatDateString(endDateMatch[0]);
    }
    return null;
};

module.exports = {
    handleMissingResponse,
    extractDate,
};
