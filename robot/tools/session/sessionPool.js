const Apify = require('apify');
const got = require('got');
const tunnel = require('tunnel');

const {sleep} = Apify.utils;
const {openKeyValueStore} = Apify;
const {SessionPool: OriginalSessionPool} = require('apify/build/session_pool/session_pool');

const log = require('../../logger');

class SessionPool extends OriginalSessionPool {
    async initialize() {
        this.keyValueStore = await openKeyValueStore(this.persistStateKeyValueStoreId);

        // in case of migration happened and SessionPool state should be restored from the keyValueStore.
        await this._maybeLoadSessionPool();

        this._listener = this.persistState.bind(this);

        // events.on(ACTOR_EVENT_NAMES_EX.PERSIST_STATE, this._listener);
    }
}

const openSessionPool = async sessionPoolOptions => {
    const sessionPool = new SessionPool(sessionPoolOptions);
    await sessionPool.initialize();
    return sessionPool;
};

const pingSessionPool = async ({proxyConfig, sessionPool, input: {debug}}) => {
    const sessionsExtended = sessionPool.sessions.map(session => {
        const {id, userData: {fingerprint}, usageCount, errorScore} = session;
        const {protocol, username, password, hostname, port} = new URL(proxyConfig.newUrl(session.id));

        return {
            data: {
                id,
                fingerprint: !!fingerprint || null,
                usageCount,
                errorScore,
            },
            proxy: {
                host: `${hostname}`,
                port,
                proxyAuth: `${username}:${password}`,
            },
        };
    });

    const asyncResponses = sessionsExtended.map(sessionExtended =>
        got(debug ?
            'https://api.ipify.org/?format=json' :
            'https://api.apify.com/v2/users/cyberfly', {
            agent: {
                http: tunnel.httpOverHttp({proxy: sessionExtended.proxy}),
                https: tunnel.httpsOverHttp({proxy: sessionExtended.proxy}),
            },
            timeout: 5 * 1000,
        }).json().catch(error => ({ip: null})));

    if (debug) {
        const responses = await Promise.all(asyncResponses);
        const sessionPoolState = responses.map((response, index) => ({
            ...sessionsExtended[index].data,
            ...response,
        }));

        log.console.debug(sessionPoolState);
        await Apify.setValue('sessionPoolState', sessionPoolState);
        // workaround for log cut-off ^
        await sleep(3 * 1000);
    }
};

module.exports = {
    SessionPool,
    openSessionPool,
    pingSessionPool,
};
