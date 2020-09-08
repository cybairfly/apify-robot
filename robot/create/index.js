const Apify = require('apify');
const R = require('ramda');

const {
    DEFAULT_OPTIONS
} = require('../consts');

const {
    getUserAgent,
    deepTransform,
} = require('../tools/tools');

// #####################################################################################################################

const CustomError = ({name = 'CustomError', data = {}, message = 'Custom Error'}) => {
    const error = Error(message);
    error.name = name;
    error.data = data;

    return error;
};

const Options = ({input, setup, INPUT: {block, stream, proxyConfig}}) => {
    const apifyProxySession = Apify.isAtHome() ?
        setup.getApifyProxySession.apify({input}) :
        setup.getApifyProxySession.local({input});

    const [proxyUrlWithoutSession] = proxyConfig && proxyConfig.proxyUrls || [];

    const proxyUrl = proxyUrlWithoutSession && proxyUrlWithoutSession.includes('proxy.apify.com')
        ? proxyUrlWithoutSession
            .split('//')
            .map((chunk, index) => index ? `session-${apifyProxySession},${chunk}` : chunk)
            .join('//')
        : proxyUrlWithoutSession;

    const defaultOptions = {
        launchPuppeteer: {
            useApifyProxy: proxyConfig ? proxyConfig.useApifyProxy : true,
            apifyProxyGroups: proxyConfig ? proxyConfig.apifyProxyGroups : undefined,
            apifyProxySession,
            defaultViewport: {
                width: 1024 + Math.floor(Math.random() * 900),
                height: 768 + Math.floor(Math.random() * 300)
            },
            headless: Apify.isAtHome() ? setup.OPTIONS.launchPuppeteer.headless : false,
            devtools: !Apify.isAtHome(),
            // ignoreHTTPSErrors: true
            // args: [
            //     '--remote-debugging-port=9222'
            // ]
        }
    };

    const options = R.mergeDeepRight(R.mergeDeepRight(DEFAULT_OPTIONS, defaultOptions), setup.OPTIONS);

    if (options.launchPuppeteer.randomUserAgent) {
        options.launchPuppeteer.userAgent = proxyConfig && proxyConfig.userAgent
            ? proxyConfig.userAgent
            : getUserAgent();
    }

    if (proxyUrl)
        options.launchPuppeteer.proxyUrl = proxyUrl;

    return options;
};

module.exports = {
    CustomError,
    Options
};
