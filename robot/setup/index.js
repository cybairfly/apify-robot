/**
 * Basic setup of the project merged with input and target-specific options at runtime
 * into the final compound setup with static options and dynamic options called during
 * runtime with current context
 */
class RobotSetup {
    constructor({tasks, options, callbacks, ...extras} = this) {
        this.tasks = tasks;
        this.options = options;
        this.callbacks = callbacks;

        // if (extras.rootPath)
        //     this._rootPath = rootPath;

        Object.entries(extras).forEach(([key, value]) => this[key] = value);
    }

    /* definition of automation tasks and their steps - abstraction for scalability */
    tasks = {
        // taskName: {
        //     /* control flow predicates */
        //     init: context => Boolean,
        //     skip: context => Boolean,
        //     stop: context => Boolean,
        //     done: context => Boolean,

        //     /* automated injection of dependent tasks (e.g. login) */
        //     merge: [
        //         string,
        //     ],

        //     steps: [
        //         {
        //             name: string,
        //             /* control flow predicates */
        //             init: context => Boolean,
        //             skip: context => Boolean,
        //             stop: context => Boolean,
        //             done: context => Boolean,
        //         },
        //     ],
        // },
    };

    /* robot options (global setup) */
    /* runtime priority: target setup > global setup > default options */
    options = {
        /* lower level automation library */
        library: {
            // playwright: true,
            // puppeteer: true,
        },

        /* browser utilized for automation */
        browser: {
            // firefox: true,
            // chrome: true,
            // webkit: true,
        },

        output: {
            /* output truthy values only?  */
            filter: true,
            schema: {}
        },

        /* notify these channels of errors */
        notify: {
            details: true,
            visuals: true,
            filters: {
                // errorNames: [],
                // errorTypes: [],
            },
            channels: {
                slack: {
                    // channel: String,
                },
            },
        },

        /* robot internal server options */
        server: {
            interface: {
                client: {
                    /* custom client views */
                    // route: 'robot/client',
                },
                events: {
                    serveOnEvents: true,
                    eventHooks: [
                        'waitForSelector',
                    ],
                },
                prompt: {
                    modal: false,
                    handlers: {
                        // eventName: () => {},
                    },
                },
                // useScreenshots: Boolean,
                // maxScreenshotFiles: Number,
                // snapshotTimeoutSecs: Number,
                // maxSnapshotFrequencySecs: Number,
            },
            websocket: {
                // events: Object,
            },
        },

        proxy: {
            proximity: {
                enable: false,
                // locationProviderId: String
            }
        },

        /* https://github.com/apify/browser-pool#new_BrowserPool_new */
        browserPool: {
            /* standalone browser with no support for stealth hooks */
            // disable: Boolean,

            /* https://github.com/apify/browser-pool#browserplugin */
            plugins: {
                // launchOptions: {},
            },

            fpgen: {
                // devices: [String],
                // browsers: [Object],
                // operatingSystems: [String],
            },

            /* https://github.com/apify/browser-pool#lifecycle-management-with-hooks */
            hooks: {
                // preLaunchHooks: () => {},
                // postLaunchHooks: () => {},
                // prePageCreateHooks: () => {},
                // postPageCreateHooks: () => {},
                // prePageCloseHooks: () => {},
                // postPageCloseHooks: () => {},

                browser: {
                    // before: () => {},
                    // after: () => {},
                },
                page: {
                    before: {
                        // open: () => {},
                        // close: () => {},
                    },
                    after: {
                        // open: () => {},
                        // close: () => {},
                    },
                },
            },
        },

        /* https://sdk.apify.com/docs/typedefs/session-pool-options */
        sessionPool: {
            // disable: Boolean | Function,
            disable: true,
        },

        /* https://playwright.dev/docs/network/#abort-requests */
        /* https://sdk.apify.com/docs/api/puppeteer#puppeteerblockrequestspage-options */
        trafficFilter: {
            /* https://playwright.dev/docs/api/class-request#requestresourcetype */
            // resources: [],

            /* https://playwright.dev/docs/api/class-request#requesturl */
            patterns: {
                /* resource extension or arbitrary pattern in url */
                // url: [],

                /* host domain pattern black-list for urls (ads) */
                // host: [],
            },
        },

        /* standalone w/o browser pool & fpgen stealth support */
        launchContext: {
            playwright: {},
            puppeteer: {},
        },

        /* https://sdk.apify.com/docs/api/apify#launchpuppeteer */
        launchPuppeteer: {},
    };

    /* define custom project specific paths */
    /* base path = this.rootPath */
    getPath = {
        generic: {
            scope: task => '../../tasks/generic',
            steps: task => '../../tasks/generic',
        },
        targets: {
            target: target => `../../tasks/targets/${target}`,
            config: target => `../../tasks/targets/${target}/config`,
            steps: target => `../../tasks/targets/${target}/steps`,
            setup: target => `../../tasks/targets/${target}/.robot`,
        },
    };

    /* TODO construct tasks */
    // getTasks = target => ({});

    /* generate unique input ID */
    getInputId = input => `auto_${Date.now().toString()}`;

    /* generate unique proxy session string for local and remote runs (@Apify) */
    getProxySessionId = {
        apify: ({input}) => input.id,
        local: ({input}) => input.id,
    };

    /* custom location lookup and parsing */
    /**
     * @param {import("../types").Robot}
     * @returns {{
        * city: string,
        * country: string,
        * stateCode: string
    * }}
    */
    // getProxyLocation = async ({input, options}) => {}

    /* default output template */
    // OutputSchema = ({input}) => Object

    /* support class import */
    set rootPath(rootPath) {
        this._rootPath = rootPath;
    }

    get rootPath() {
        return this._rootPath;
    }
}

module.exports = RobotSetup;
