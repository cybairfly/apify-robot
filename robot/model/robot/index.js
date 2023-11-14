const Apify = require('apify');
const Robot = require('apify-robot');

const input = require('./input');
const tasks = require('./tasks');
const consts = require('./consts');
const server = require('./server');
const outputs = require('./outputs');

class Setup extends Robot.Setup {
    input = input;
    tasks = tasks;
    consts = consts;
    outputs = outputs;

    // default options overrides:
    options = {
        library: {
            // playwright: true,
            // puppeteer: true,
        },

        browser: {
            // firefox: true,
            // chromium: true,
            // webkit: true,
        },

        notify: {
            details: false,
            visuals: true,
            filters: {
                errorNames: [],
                errorTypes: [],
            },
            channels: {
                slack: {
                    channel: 'monitoring',
                },
            },
        },

        server: {
            interface: {
                useScreenshots: true,
                client: {
                    route: 'robot/client',
                },
                events: {
                    serveOnEvents: true,
                    eventHooks: [
                        'waitForSelector',
                    ],
                },
                prompt: {
                    modal: false,
                    handlers: {},
                },
            },
            websocket: {
                events: server.websocket.events,
            },
        },

        browserPool: {
            plugins: {
                useIncognitoPages: true,
                launchOptions: {
                    headless: Apify.Actor.isAtHome(),
                    devtools: !Apify.Actor.isAtHome(),
                },
            },
            fpgen: {
                devices: [ 'desktop' ],
                browsers: [ {
                    name: 'firefox',
                    minVersion: 88,
                } ],
                operatingSystems: [ 'linux' ],
            },
            hooks: {
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
            maxPoolSize: 100,
            disable: ({ input, input: { proxyConfig }, options }) => !Apify.Actor.isAtHome()
                || input.session
                || options.browserPool.disable
                || options.proxy.proximity.enable
                || proxyConfig.proxyUrls?.length
                || proxyConfig.groups.includes('RESIDENTIAL'),
        },

        /* https://playwright.dev/docs/network/#abort-requests */
        trafficFilter: {
            /* https://playwright.dev/docs/api/class-request#requestresourcetype */
            resources: [
                'image',
                'media',
            ],
            /* https://playwright.dev/docs/api/class-request#requesturl */
            patterns: {
                // resource extension or arbitrary pattern in url
                url: [ '.jpg', '.jpeg', '.png', '.svg', '.gif', '.ico', '.ttf', '.pdf', '.zip', '.mp3', '.mp4', '.webm', '.webp', '.woff', 'blob:', 'data:image/' ],
                // host domain pattern black-list for urls (ads)
                host: [ 'analytics.com' ],
            },
        },
    }

    getPath = {
        // support for custom project structure
        // base path = root
        generic: {
            scope: task => 'tasks/generic',
            steps: task => 'tasks/generic',
            setup: target => 'tasks/generic/.robot',
        },
        targets: {
            target: target => `tasks/targets/${target}`,
            config: target => `tasks/targets/${target}/config`,
            steps: target => `tasks/targets/${target}/steps`,
            setup: target => `tasks/targets/${target}/.robot`,
        },
    };

    getProxyLocation = async ({ input, options }) => ({
        ...(await Apify.call(options.proxy.proximity.locationProviderId, { ip: input.ipAddress })).output?.body,
        country: 'us',
    });

    getProxySessionId = {
        apify: ({ input: { target }, input }) => `${target}_${input.id}`,
        local: ({ input: { target }, input }) => `${target}_${input.id}`,
    };

    getInputId = async input => {
        const username = await Robot.tools.decrypt(input.username, !Apify.Actor.isAtHome());
        return username.replace(/\W/gi, '');
    }

    OutputSchema = ({ input }) => require('../OUTPUT_SCHEMA');
}

module.exports = new Setup();
