const Apify = require('apify');
const R = require('ramda');
const dot = require('dot-object');

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

const parseInputOptions = input => {
    const inputOptions = Object.entries(input)
        .filter(([key]) => key.includes('options.'))
        .reduce((pool, [key, value]) => ({
            ...pool,
            [key]: value,
        }), {}) || {};

    return dot.object(inputOptions).options || {};
};

const getDefaultOptions = ({ input: { target }, input, setup}) => {
    const defaultOptions = {
        launchPuppeteer: {
            // useApifyProxy: proxyConfig ? proxyConfig.useApifyProxy : true,
            // apifyProxyGroups: proxyConfig ? proxyConfig.apifyProxyGroups : undefined,
            // apifyProxySession,
            defaultViewport: {
                width: 1024 + Math.floor(Math.random() * 900),
                height: 768 + Math.floor(Math.random() * 300),
            },
            headless: Apify.isAtHome() ? setup.options.launchPuppeteer.headless : false,
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

    return R.mergeDeepRight(DEFAULT_OPTIONS, defaultOptions);
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

const InputOptions = input => parseInputOptions(input);

const RobotOptions = ({ input: {browser, block, session, proxyConfig }, input, setup}) => {
    const defaultOptions = getDefaultOptions({input, setup});
    const inputOptions = parseInputOptions(input);
    const forceOptions = setup.input ? parseInputOptions(setup.input) : {};
    const options = R.mergeDeepRight(R.mergeDeepRight(R.mergeDeepRight(defaultOptions, inputOptions), setup.options), forceOptions);

    options.sessionPool.disable = typeof options.sessionPool.disable === 'function' ?
        options.sessionPool.disable({input, options}) :
        options.sessionPool.disable || false;

    if (options.launchPuppeteer.randomUserAgent) {
        options.launchPuppeteer.userAgent = proxyConfig && proxyConfig.userAgent
            ? proxyConfig.userAgent
            : getUserAgent();
    }

    if (browser) {
        options.browser = {};
        options.browser[browser] = true;
    }

    if (block)
        options.trafficFilter = transformOptions.trafficFilter(options.trafficFilter);

    return options;
};

module.exports = {
    redactOptions,
    InputOptions,
    RobotOptions,
    Options,
};
