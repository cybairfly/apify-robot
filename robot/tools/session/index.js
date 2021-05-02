const Apify = require('apify');

/** @param {import('../../index')} */
const getSessionId = ({input: {session}, context, setup, sessionId}) => {
    if (sessionId)
        return sessionId;

    if (session) {
        return Apify.isAtHome() ?
            setup.getProxySessionId.apify(context) :
            setup.getProxySessionId.local(context);
    }

    return Apify.isAtHome() ?
        `${setup.getProxySessionId.apify(context)}_${Date.now()}` :
        `${setup.getProxySessionId.local(context)}_${Date.now()}`;
};

module.exports = {
    getSessionId,
};
