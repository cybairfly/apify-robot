const Apify = require('apify');

/** @param {import('../../index')} */
const getSessionId = ({input, error, context, setup, sessionId, sessionRetired}) => {
    if (sessionId)
        return sessionId;

    if (input.session && !sessionRetired) {
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
