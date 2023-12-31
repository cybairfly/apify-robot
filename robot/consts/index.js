const Apify = require('apify');
const crypto = require('crypto');
const RobotError = require('../errors');

const APIFY = {
    utils: {
        log: {
            methodsNames: [
                'info',
                'debug',
                'error',
                'warning',
            ],
        },
    },
};

const TIMEOUTS = {
    one: 1 * 1000,
    five: 5 * 1000,
    ten: 10 * 1000,
    half: 15 * 1000,
    default: 30 * 1000,
    double: 2 * 30 * 1000,
    triple: 3 * 30 * 1000,
};

const DEFAULT_OPTIONS = {
    library: {
        // playwright: true,
        // puppeteer: true,
    },

    browser: {
        // firefox: true,
        // chrome: true,
        // webkit: true,
    },

    crypto: {
        publicKey: {
            format: 'der',
            type: 'spki',
        },
        privateKey: {
            format: 'der',
            type: 'pkcs8',
        },
        encrypt: {
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        decrypt: {
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
    },

    server: {
        interface: {
            useScreenshots: false,
            maxScreenshotFiles: 20,
            snapshotTimeoutSecs: 2,
            maxSnapshotFrequencySecs: 1,
            // screenshotDirectoryPath: 'key_value_stores/default',
            prompt: {
                modal: false,
                handlers: {},
            },
        },
        websocket: {
            // events: Object,
        },
    },

    browserPool: {
        disable: false,
        plugins: {
            launchOptions: {
                headless: Apify.Actor.isAtHome(),
            },
        },
        hooks: {
            preLaunchHooks: null,
            postLaunchHooks: null,
            prePageCreateHooks: null,
            postPageCreateHooks: null,
            prePageCloseHooks: null,
            postPageCloseHooks: null,
            browser: {
                before: null,
                after: null,
            },
            page: {
                before: {
                    open: null,
                    close: null,
                },
                after: {
                    open: null,
                    close: null,
                },
            },
        },
    },

    sessionPool: {
        sessionOptions: {
            maxAgeSecs: 24 * 60 * 60,
        },
    },

    trafficFilter: {
        resources: [
            // 'document',
            // 'stylesheet',
            'image',
            'media',
            // 'font',
            // 'script',
            // 'texttrack',
            // 'xhr',
            // 'fetch',
            // 'eventsource',
            // 'websocket',
            // 'manifest',
            // 'other',
        ],
        patterns: {
            url: ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.ico', '.pdf', '.zip', '.webm', '.webp', '.woff', 'blob:', 'data:image/'],
            host: [
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
                'zendesk',
            ],
        },
    },

    launchPuppeteer: {
        randomUserAgent: false,
        headless: true,
        stealthOptions: {
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
};

const EVENTS = {
    console: 'console',
    dialog: 'dialog',
    framenavigated: 'framenavigated',
    domcontentloaded: 'domcontentloaded',
    error: 'error',
    load: 'load',
    networkidle: 'networkidle',
    pageerror: 'pageerror',
    popup: 'popup',
    request: 'request',
    requestfailed: 'requestfailed',
    requestfinished: 'requestfinished',
    response: 'response',
};

const LOGGER = {
    triggerMethods: {
        page: [
            // '$',
            // '$$',
            // '$$eval',
            '$eval',
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
            'press',
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
            // 'keyboard',
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
        keyboard: [
            'press',
        ],
    },
};

const SERVER = {
    interface: {
        triggerMethods: [
            // 'goto',
            // 'waitFor',
            // 'waitForFunction',
            'waitForSelector',
            // 'waitForXPath',
        ],
    },
};

const SESSION = {
    retireStatusCodes: [401, 403, 429],
};

// TODO remove legacy
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
            ],
        },
    },
};

module.exports = {
    APIFY,
    DEFAULT_OPTIONS,
    EVENTS,
    LOGGER,
    SERVER,
    SESSION,
    TIMEOUTS,
    PUPPETEER,
};
