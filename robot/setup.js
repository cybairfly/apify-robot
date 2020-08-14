class RobotSetup {
    rootPath = '';
    tasks = {};
    OutputTemplate = () => {};
    getTasks = target => ({});
    getInputId = input => {};

    getPath = {
        // base path = root
        generic: {
            flows: (task) => `tasks/generic/flows`,
            steps: (task) => `tasks/generic/steps`,
        },
        targets: {
            target: (target) => `tasks/targets/${target}`,
            config: (target) => `tasks/targets/${target}/config`,
            flows: (target) => `tasks/targets/${target}/flows`,
            steps: (target) => `tasks/targets/${target}/steps`,
            setup: (target) => `tasks/targets/${target}/setup`,
        }
    };

    getApifyProxySession = {
        // local: ({input}) => Math.random().toString(),
        apify: ({input}) => {},
        local: ({input}) => {},
    };

    SLACK = {
        channel: ''
    };

    SERVER = {};

    OPTIONS = {
        blockRequests: {},
        launchPuppeteer: {},
        liveViewServer: {},
    };

    OUTPUTS = {};
}

module.exports = RobotSetup;
