const { log, matchPattern } = require('../public/tools');
const { SELECTORS } = require('./config');

const handleMissingResponse = page => async error => {
    const isConnectionError = await matchPattern(page, [{
        selector: SELECTORS.loginErrorMessage,
        contents: ['experiencing slow internet connection'],
    }]);

    if (isConnectionError)
        throw new Robot.errors.Network({ retry: true });

    const isTimeoutError = error.message.includes('TimeoutError: page.waitForResponse');
    if (isTimeoutError)
        throw new Robot.errors.timeout.Response({ error, retry: true, rotateSession: true });

    throw error;
};

const restoreBrowserStorage = {
    localStorage: async ({ page, session }) => {
        if (session.userData.storage?.local) {
            const data = JSON.parse(session.userData.storage.local);
            const code = items =>
                Object
                    .entries(items)
                    .forEach(([key, value]) => localStorage[key] = value);

            await page.evaluate(code, data).catch(error => log.warning(error.message));
        }
    },
    sessionStorage: async ({ page, session }) => {
        if (session.userData.storage?.session) {
            const data = JSON.parse(session.userData.storage.session);
            const code = items =>
                Object
                    .entries(items)
                    .forEach(([key, value]) => sessionStorage[key] = value);

            await page.evaluate(code, data).catch(error => log.warning(error.message));
        }
    },
};

module.exports = {
    handleMissingResponse,
    restoreBrowserStorage,
};
