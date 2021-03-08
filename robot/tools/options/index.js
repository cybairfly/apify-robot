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
    blockRequests: patterns =>
        Array.isArray(patterns) ?
            patterns : {
                urlPatterns: Object
                    .keys(patterns)
                    .reduce((pool, next) => {
                        return pool = [
                            ...pool,
                            ...patterns[next],
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

const RobotOptions = ({ actorInput: { block, stream, proxyConfig }, input, setup}) => {
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
    };

    const options = R.mergeDeepRight(R.mergeDeepRight(DEFAULT_OPTIONS, defaultOptions), setup.OPTIONS);

    if (options.launchPuppeteer.randomUserAgent) {
        options.launchPuppeteer.userAgent = proxyConfig && proxyConfig.userAgent
            ? proxyConfig.userAgent
            : getUserAgent();
    }

    if (block)
        options.blockRequests = transformOptions.blockRequests(options.blockRequests);

    return options;
};

module.exports = {
    redactOptions,
    RobotOptions,
    Options,
};
