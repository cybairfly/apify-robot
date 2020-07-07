module.exports = {
    tasks: [
        {
            name: 'login',
            steps: [
                {
                    name: 'checkSession',
                    done: ({relay}) => typeof relay.skipLogin === 'boolean',
                },
                {
                    name: 'getSecrets',
                    skip: ({relay}) => relay.skipLogin,
                    done: ({relay}) => relay.password,
                },
                {
                    name: 'loginAgent',
                    skip: ({relay}) => relay.skipLogin,
                    done: ({output}) => output.isLoginSuccess,
                },
            ],
            // TODO stop if in dependency tree & not done
            done: null,
            stop: ({OUTPUT}) => !OUTPUT.isValidSession && !OUTPUT.isLoginSuccess,
        },
        {
            name: 'query',
            merge: [
                'login'
            ],
            steps: [
                {
                    name: 'searchPolicy',
                    done: ({output}) => output.isSearchSuccess,
                },
                {
                    name: 'startPayment',
                    done: ({output}) => output.paymentAmount,
                },
            ],
            stop: ({OUTPUT}) => !OUTPUT.paymentAmount,
        },
        {
            name: 'payment',
            init: ({INPUT}) => INPUT.tasks.includes('payment'),
            merge: [
                'query'
            ],
            steps: [
                {
                    name: 'finishPayment',
                    done: ({output}) => output.isPaymentSuccess,
                },
                {
                    name: 'verifyResult',
                    done: ({output}) => output.isPaymentVerified,
                },
                {
                    name: 'backupOutput',
                    done: ({output}) => output.isBackupStored,
                }
            ],
        },
    ],
    SLACK: {
        channel: 'x_apify_veronica'
    },
    SERVER: {
        actions: {
            abort: 'abort',
            cancel: 'cancel',
            confirm: 'confirm'
        }
    },
    OPTIONS: {
        blockRequests: {},
        launchPuppeteer: {},
        liveViewServer: {},
    },
    OUTPUTS: {
        loginSuccess: {
            isLoginSuccess: true
        },
        loginFailed: {
            isLoginSuccess: false
        },
        validSession: {
            isValidSession: true
        },
        invalidSession: {
            isValidSession: false
        },
        searchSuccess: {
            isSearchSuccess: true
        },
        searchFailed: {
            isSearchSuccess: false
        },
        paymentSuccess: {
            isPaymentSuccess: true
        },
        paymentFailed: {
            isPaymentSuccess: false
        },
        paymentVerified: {
            isPaymentVerified: true
        },
        paymentUnverified: {
            isPaymentVerified: false
        },
        backupStored: {
            isBackupStored: true
        },
        backupNotStored: {
            isBackupStored: false
        },
        paymentAborted: {
            isPaymentAborted: true
        },
        alreadyCharged: {
            isAlreadyCharged: true
        },
        knownError: {
            isKnownError: true
        },
    },
    OutputTemplate: () => require('./OUTPUT_SCHEMA'),
    getTasks: target => ({}),
    getInputId: input => input.policyNumber,
    getPath: {
        generic: {
            flows: (task) => `tasks/generic/flows`,
            steps: (task) => `tasks/generic/steps`,
        },
        targets: {
            flows: (target) => `tasks/targets/${target}/flows`,
            steps: (target) => `tasks/targets/${target}/steps`,
        },
        configs: {
            robot: (target) => `tasks/targets/${target}/config/robot`,
            target: (target) => `tasks/targets/${target}/config/target`
        }
    },
    getApifyProxySession: {
        apify: ({input}) => input.policyNumber.replace(/\W/g, ''),
        local: ({input}) => input.policyNumber.replace(/\W/g, ''),
    },
};
