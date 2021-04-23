class RobotSetup {
    /* definition of automation tasks */
    tasks = {
        // taskName: {
        //     /* control flow predicates */
        //     init: context => Boolean,
        //     skip: context => Boolean,
        //     stop: context => Boolean,
        //     done: context => Boolean,

        //     /* task dependencies used to build dependency tree before launch */
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
        /* notify these channels of errors */
        notify: {
            details: true,
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
            livecast: {
                // events: Object,
                // useScreenshots: Boolean,
                // maxScreenshotFiles: Number,
                // snapshotTimeoutSecs: Number,
                // maxSnapshotFrequencySecs: Number,
            },
            websocket: {
                // events: Object,
            },
        },

        browserPool: {
            // disable: false,
            browser: {
                // firefox: true,
                // chrome: true,
                // webkit: true,
            },
            library: {
                // playwright: true,
                // puppeteer: true,
            },
            options: {
                // launchOptions: {},
            },
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
        sessionPool: {},

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

        /* https://sdk.apify.com/docs/api/apify#launchpuppeteer */
        launchPuppeteer: {},

        /* https://sdk.apify.com/docs/api/live-view-server */
        liveViewServer: {},
    };

    /* default output generator */
    // OutputSchema = ({input}) => Object

    /* TODO */
    // getTasks = target => ({});

    /* generate unique input ID */
    // getInputId = input => String;

    /* define custom project specific paths */
    /* base path = this.rootPath */
    getPath = {
        generic: {
            // scope: task => 'tasks/generic/index',
            // flows: task => 'tasks/generic/flows',
            // steps: task => 'tasks/generic/steps',
        },
        targets: {
            // target: target => `tasks/targets/${target}`,
            // config: target => `tasks/targets/${target}/config`,
            // flows: target => `tasks/targets/${target}/flows`,
            // steps: target => `tasks/targets/${target}/steps`,
            // setup: target => `tasks/targets/${target}/setup`,
        },
    };

    /* generate unique proxy session string for local and remote runs (@Apify) */
    getApifyProxySession = {
        // apify: ({input}) => String,
        // local: ({input}) => String,
    };

    /* output presets to be used by task steps */
    OUTPUTS = {
    //     outputTemplate: {
    //         outputProperty: outputValue
    //     }
    };

    /* support instance import */
    constructor(rootPath) {
        if (rootPath)
            this._rootPath = rootPath;
    }

    /* support class import */
    set rootPath(rootPath) {
        this._rootPath = rootPath;
    }

    get rootPath() {
        return this._rootPath;
    }
}

module.exports = RobotSetup;
