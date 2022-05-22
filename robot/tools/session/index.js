/**
 * @typedef {import('../../types.d').Robot} Robot
 * @typedef {import('apify').Session} Session
 */
const Apify = require('apify');
const log = require('../../logger');

/**
 * Create a session with custom ID in the session pool and return the created session
 * @param {Robot}
 * @returns {Session} session
 */
const addSession = async ({sessionPool, sessionId, options}) =>
    sessionPool.addSession({
        ...options.sessionPool?.sessionOptions,
        id: sessionId,
    }).then(() => sessionPool.getSession(sessionId));

/**
 * Create a session ID string with optional randomization on retries or return existing ID
 * @param {Robot}
 * @returns {string} sessionId
 */
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

/**
 * Persist shared session pool if session already existed or pool is not full
 * @param {Robot}
 */
const persistSessionPoolMaybe = async ({input, options, session, sessionPool}) => {
    // TODO maybe update in newer version of session pool
    // const originalSession = sessionPool.sessionMap.get(session.id);
    const originalSession = sessionPool.sessions.find(originalSession => originalSession.id === session.id);
    const poolHasVacancy = sessionPool.sessions.length < options.sessionPool.maxPoolSize;
    const doPersistState = originalSession || poolHasVacancy;
    if (doPersistState) {
        // prevent accidental pollution of different sessions
        if (!input.session) {
            session.userData = session.userData.fingerprint ? {
                fingerprint: session.userData.fingerprint,
            } : {};

            log.debug('User data have been removed from session. Enable session persistence to avoid this.');
        }

        sessionPool.sessions = originalSession ? [
            ...sessionPool.sessions.filter(originalSession => originalSession.id !== session.id),
            session,
        ] : [
            ...sessionPool.sessions,
            session,
        ];

        await sessionPool.persistState();
    }
};

module.exports = {
    addSession,
    getSessionId,
    persistSessionPoolMaybe,
};
