const Apify = require('apify');

/** @param {import('../../index')} */
const getSessionId = ({input, setup, sessionId, rotateSession}) => {
    if (sessionId)
        return sessionId;

    if (input.session && !rotateSession) {
        sessionId = Apify.isAtHome() ?
            setup.getProxySessionId.apify({input}) :
            setup.getProxySessionId.local({input});
    } else {
        sessionId = Apify.isAtHome() ?
            `${setup.getProxySessionId.apify({input})}_${Date.now()}` :
            `${setup.getProxySessionId.local({input})}_${Date.now()}`;
    }

    // sessionId must not be longer than 50 characters
    return sessionId.slice(0, 50);
};

module.exports = {
    getSessionId,
};
