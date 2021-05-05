const Apify = require('apify');

/** @param {import('../../index')} */
const getSessionId = ({input: {session}, context, setup, sessionId}) => {
    if (sessionId)
        return sessionId;

    if (session) {
        sessionId = Apify.isAtHome() ?
            setup.getProxySessionId.apify(context) :
            setup.getProxySessionId.local(context);
    } else {
        sessionId = Apify.isAtHome() ?
            `${setup.getProxySessionId.apify(context)}_${Date.now()}` :
            `${setup.getProxySessionId.local(context)}_${Date.now()}`;
    }

    // sessionId must not be longer than 50 characters
    return sessionId.slice(0, 50);
};

module.exports = {
    getSessionId,
};
