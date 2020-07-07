const Apify = require('apify');
const R = require('ramda');

const {
    DEFAULT_OPTIONS
} = require('./consts');

const {
    getUserAgent,
    deepTransform,
} = require('./tools/tools');

// #####################################################################################################################

const CustomError = ({name = 'CustomError', data = {}, message = 'Custom Error'}) => {
    const error = Error(message);
    error.name = name;
    error.data = data;

    return error;
};

const Options = ({input, config, INPUT: {target, block, stream, proxyConfig}}) => {
    const CUSTOM_OPTIONS = {
        global: config.OPTIONS || {},
        target: tryRequire.global(config.getPath.configs.robot(target)) || {},
    };

    const OPTIONS = R.mergeDeepRight(R.mergeDeepRight(DEFAULT_OPTIONS, CUSTOM_OPTIONS.global), CUSTOM_OPTIONS.target);

    const apifyProxySession = Apify.isAtHome() ?
        config.getApifyProxySession.apify({input}) :
        config.getApifyProxySession.local({input});

    const [proxyUrlWithoutSession] = proxyConfig && proxyConfig.proxyUrls || [];

    const proxyUrl = proxyUrlWithoutSession && proxyUrlWithoutSession.includes('proxy.apify.com')
        ? proxyUrlWithoutSession
            .split('//')
            .map((chunk, index) => index ? `session-${apifyProxySession},${chunk}` : chunk)
            .join('//')
        : proxyUrlWithoutSession;

    const options = {
        launchPuppeteer: {
            useApifyProxy: proxyConfig ? proxyConfig.useApifyProxy : true,
            apifyProxyGroups: proxyConfig ? proxyConfig.apifyProxyGroups : undefined,
            apifyProxySession,
            defaultViewport: {
                width: 1024 + Math.floor(Math.random() * 900),
                height: 768 + Math.floor(Math.random() * 300)
            },
            headless: Apify.isAtHome() ? OPTIONS.launchPuppeteer.headless : false,
            // stealth: true,
            // useChrome: true,
            stealthOptions: OPTIONS.launchPuppeteer.stealth,
            devtools: !Apify.isAtHome(),
            // ignoreHTTPSErrors: true
            // args: [
            //     '--remote-debugging-port=9222'
            // ]
        }
    };

    if (!OPTIONS.launchPuppeteer.keepUserAgent) {
        options.launchPuppeteer.userAgent = proxyConfig && proxyConfig.userAgent
            ? proxyConfig.userAgent
            : getUserAgent();
    }

    if (proxyUrl)
        options.launchPuppeteer.proxyUrl = proxyUrl;

    if (block)
        options.blockRequests = OPTIONS.blockRequests;

    if (stream)
        options.liveViewServer = OPTIONS.liveViewServer;

    return options;
};

module.exports = {
    CustomError,
    Options
};
