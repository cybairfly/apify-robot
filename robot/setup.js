class RobotSetup {
    /* definition of automation tasks */
    // tasks = {
    //     taskName: {
    //         /* task flow control - execution sequence predicates */
    //         init: ({INPUT, OUTPUT, input, output, relay}) => Boolean,
    //         skip: ({INPUT, OUTPUT, input, output, relay}) => Boolean,
    //         stop: ({INPUT, OUTPUT, input, output, relay}) => Boolean,
    //         done: ({INPUT, OUTPUT, input, output, relay}) => Boolean,

    //         /* task dependencies used to build dependency tree before launch */
    //         merge: [
    //             string
    //         ],

    //         steps: [
    //             {
    //                 name: string,
    //                 /* step flow control - execution sequence predicates */
    //                 init: ({INPUT, OUTPUT, input, output, relay}) => Boolean,
    //                 skip: ({INPUT, OUTPUT, input, output, relay}) => Boolean,
    //                 stop: ({INPUT, OUTPUT, input, output, relay}) => Boolean,
    //                 done: ({INPUT, OUTPUT, input, output, relay}) => Boolean
    //             },
    //         ],
    //     }
    // };

    /* default output generator */
    // OutputTemplate = ({INPUT, input}) => Object

    /* TODO */
    // getTasks = target => ({});

    /* generate unique input ID */
    // getInputId = input => String;

    /* define custom project specific paths */
    /* base path = this.rootPath */
    // getPath = {
    //     generic: {
    //         flows: (task) => `tasks/generic/flows`,
    //         steps: (task) => `tasks/generic/steps`,
    //     },
    //     targets: {
    //         target: (target) => `tasks/targets/${target}`,
    //         config: (target) => `tasks/targets/${target}/config`,
    //         flows: (target) => `tasks/targets/${target}/flows`,
    //         steps: (target) => `tasks/targets/${target}/steps`,
    //         setup: (target) => `tasks/targets/${target}/setup`,
    //     }
    // };

    /* generate unique proxy session string for local and remote runs (@Apify) */
    // getApifyProxySession = {
    //     apify: ({input}) => String,
    //     local: ({input}) => String,
    // };

    /* Slack specific options for error alerts */
    // SLACK = {
    //     channel: String
    // };

    /* robot internal server options */
    // SERVER = {
    //     liveView: {
    //         events: Object
    //     },
    //     webSocket: {
    //         events: Object
    //     }
    // };

    /* robot options (global setup) */
    /* runtime priority: target setup > global setup > default options */
    OPTIONS = {
        browserPool: {
            disable: false,
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

        /* https://sdk.apify.com/docs/api/puppeteer#puppeteerblockrequestspage-options */
        blockRequests: {},

        /* https://sdk.apify.com/docs/api/apify#launchpuppeteer */
        launchPuppeteer: {},

        /* https://sdk.apify.com/docs/api/live-view-server */
        liveViewServer: {},
    };

    /* output presets to be used by task steps */
    // OUTPUTS = {
    //     outputTemplate: {
    //         outputProperty: outputValue
    //     }
    // };

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
