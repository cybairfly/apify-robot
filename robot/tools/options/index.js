const Apify = require('apify');
const R = require('ramda');

const { DEFAULT_OPTIONS } = require('../../consts');
const { getUserAgent } = require('..');

// TODO deprecate or generalize
const redactOptions = options => ({
    ...options,
    launchPuppeteer: {
        ...options.launchPuppeteer,
        ...(options.launchPuppeteer.proxyUrl ? {proxyUrl: '<redacted>'} : {}),
    },
});

const transformOptions = {
    trafficFilter: options =>
        Array.isArray(options) ?
            options : {
                resourceTypes: options.resources,
                urlPatterns: Object
                    .keys(options.patterns)
                    .reduce((pool, next) => {
                        return pool = [
                            ...pool,
                            ...options.patterns[next],
                        ];
                    }, []),
            },
};

// TODO deprecate
const Options = {
    blockRequests: (target, CUSTOM_OPTIONS, DEFAULT_OPTIONS) => ({
        urlPatterns: Object
            .keys(DEFAULT_OPTIONS.blockRequests)
            .reduce((pool, next) => {
                return pool = [
                    ...pool,
                    ...(CUSTOM_OPTIONS && CUSTOM_OPTIONS.blockRequests ?
                        CUSTOM_OPTIONS.blockRequests[next] || DEFAULT_OPTIONS.blockRequests[next] :
                        DEFAULT_OPTIONS.blockRequests[next]),
                ];
            }, []),
    }),
};

const RobotOptions = ({ input: { block, stream, proxyConfig }, input, setup}) => {
    const defaultOptions = {
        launchPuppeteer: {
            // useApifyProxy: proxyConfig ? proxyConfig.useApifyProxy : true,
            // apifyProxyGroups: proxyConfig ? proxyConfig.apifyProxyGroups : undefined,
            // apifyProxySession,
            defaultViewport: {
                width: 1024 + Math.floor(Math.random() * 900),
                height: 768 + Math.floor(Math.random() * 300),
            },
            headless: Apify.isAtHome() ? setup.OPTIONS.launchPuppeteer.headless : false,
            devtools: !Apify.isAtHome(),
            // ignoreHTTPSErrors: true
            // args: [
            //     '--remote-debugging-port=9222'
            // ]
        },
        sessionPool: {
            sessionOptions: {
                userData: {
                    target,
                },
            },
            persistStateKeyValueStoreId: `sessions-${target}`,
        },
    };

    const options = R.mergeDeepRight(R.mergeDeepRight(DEFAULT_OPTIONS, defaultOptions), setup.OPTIONS);

    if (options.launchPuppeteer.randomUserAgent) {
        options.launchPuppeteer.userAgent = proxyConfig && proxyConfig.userAgent
            ? proxyConfig.userAgent
            : getUserAgent();
    }

    if (block)
        options.trafficFilter = transformOptions.trafficFilter(options.trafficFilter);

    return options;
};

module.exports = {
    redactOptions,
    RobotOptions,
    Options,
};
