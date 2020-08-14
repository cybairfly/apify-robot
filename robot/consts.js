const crypto = require('crypto');

const APIFY = {
    utils: {
        log: {
            methodsNames: [
                'info',
                'debug',
                'error',
                'warning',
            ]
        }
    }
};

const TIMEOUTS = {
    five: 5 * 1000,
    ten: 10 * 1000,
    half: 15 * 1000,
    default: 30 * 1000,
    double: 2 * 30 * 1000,
    triple: 3 * 30 * 1000
};

// TODO
const PATTERN_SORTING = [
    'isAlreadyCancelled',
    'isThirdPartyBilling',
    'isNonCancellable',
    'verifyCancelSuccess'
];

const DEFAULT_OPTIONS = {
    crypto: {
        publicKey: {
            format: 'der',
            type: 'spki'
        },
        privateKey: {
            format: 'der',
            type: 'pkcs8'
        },
        encrypt: {
            padding: crypto.constants.RSA_PKCS1_PADDING
        },
        decrypt: {
            padding: crypto.constants.RSA_PKCS1_PADDING
        }
    },
    blockRequests: {
        patterns: [".jpg", ".jpeg", ".png", ".svg", ".gif", ".ico", ".pdf", ".zip", ".webm", ".webp", ".woff", "data:image/"],
        analytics: [
            'adobedtm',
            'adnxs.com',
            'analytics.yahoo',
            'adservice.google.com',
            'bing',
            'branch.io',
            'doubleclick.net',
            'connect.facebook',
            'taboola.com',
            'outbrain.com',
            'p.adsymptotic.com',
            'googletagmanager',
            'hotjar.com',
            'fullstory.com',
            'px.ads.linkedin.com',
            'google-analytics',
            'iponweb',
            'mathtag',
            'newrelic',
            'optimizely',
            'perimeterx',
            'sitelabweb',
            'tapad',
            'tribalfusion',
            'tr.snapchat.com',
            'zendesk'
        ]
    },
    launchPuppeteer: {
        headless: true,
        stealth: {
            // addPlugins: false,
            // emulateWindowFrame: false,
            // emulateWebGL: false,
            // emulateConsoleDebug: false,
            // addLanguage: false,
            // hideWebDriver: false,
            // hackPermissions: false,
            // mockChrome: false,
            mockChromeInIframe: false,
            // mockDeviceMemory: false
        },
    },
    liveViewServer: {
        useScreenshots: true,
        maxScreenshotFiles: 20,
        snapshotTimeoutSecs: 2,
        maxSnapshotFrequencySecs: 1,
        // screenshotDirectoryPath: 'key_value_stores/default'
    },
};

const PUPPETEER = {
    events: {
        dialog: 'dialog',
        domcontentloaded: 'domcontentloaded',
        error: 'error',
        load: 'load',
        pageerror: 'pageerror',
        popup: 'popup',
        request: 'request',
        requestfailed: 'requestfailed',
        requestfinished: 'requestfinished',
        response: 'response',
    },
    page: {
        methodsNames: {
            logging: [
                // '$',
                // '$$',
                // '$$eval',
                // '$eval',
                // '$x',
                // 'accessibility',
                // 'addScriptTag',
                // 'addStyleTag',
                // 'authenticate',
                // 'bringToFront',
                // 'browser',
                // 'browserContext',
                'click',
                'close',
                // 'content',
                // 'cookies',
                // 'coverage',
                // 'deleteCookie',
                // 'emulate',
                // 'emulateMedia',
                // 'emulateMediaFeatures',
                // 'emulateMediaType',
                // 'emulateTimezone',
                // 'emulateVisionDeficiency',
                // 'evaluate',
                // 'evaluateHandle',
                // 'evaluateOnNewDocument',
                // 'exposeFunction',
                'focus',
                // 'frames',
                'goBack',
                'goForward',
                'goto',
                'hover',
                // 'isClosed',
                'keyboard',
                // 'mainFrame',
                // 'metrics',
                // 'mouse',
                // 'pdf',
                // 'queryObjects',
                'reload',
                // 'screenshot',
                'select',
                // 'setBypassCSP',
                // 'setCacheEnabled',
                // 'setContent',
                // 'setCookie',
                // 'setDefaultNavigationTimeout',
                // 'setDefaultTimeout',
                // 'setExtraHTTPHeaders',
                // 'setGeolocation',
                // 'setJavaScriptEnabled',
                // 'setOfflineMode',
                // 'setRequestInterception',
                // 'setUserAgent',
                // 'setViewport',
                'tap',
                'target',
                'title',
                // 'touchscreen',
                // 'tracing',
                'type',
                // 'url',
                'viewport',
                'waitFor',
                // 'waitForFileChooser',
                'waitForFunction',
                'waitForNavigation',
                // 'waitForRequest',
                // 'waitForResponse',
                'waitForSelector',
                'waitForXPath',
                // 'workers'
            ],
            liveView: [
                // 'goto',
                'waitFor',
                // 'waitForSelector',
            ]
        },
    }
};

module.exports = {
    APIFY,
    DEFAULT_OPTIONS,
    PATTERN_SORTING,
    TIMEOUTS,
    PUPPETEER,
};
