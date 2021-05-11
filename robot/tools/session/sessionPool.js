const Apify = require('apify');
const got = require('got');
const tunnel = require('tunnel');

const {openKeyValueStore} = require('apify/build/key_value_store');
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
    const proxyUrls = sessionPool.sessions.map(session => {
        const {protocol, username, password, hostname, port} = new URL(proxyConfig.newUrl(session.id));

        return {
            host: `${hostname}`,
            port,
            proxyAuth: `${username}:${password}`,
        };
    });

    const asyncResponses = proxyUrls.map(proxy =>
        got(debug ?
            'https://api.ipify.org/?format=json' :
            'https://api.apify.com/v2/users/cyberfly', {
            agent: {
                http: tunnel.httpOverHttp({proxy}),
                https: tunnel.httpsOverHttp({proxy}),
            },
            timeout: 5 * 1000,
        }).catch(error => ({body: 'response failure'})));

    if (debug) {
        const responses = await Promise.all(asyncResponses);
        log.debug(responses.map(response => response.body));
    }
};

module.exports = {
    SessionPool,
    openSessionPool,
    pingSessionPool,
};
