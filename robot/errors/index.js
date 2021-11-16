/**
 * @typedef {import('./types').RobotErrorOptions} RobotErrorOptions
 * @typedef {import('./types').StatusErrorOptions} StatusErrorOptions
 */

/* eslint-disable max-classes-per-file */
/* eslint-disable lines-between-class-members */
const RobotError = require('./robot.error');

/**
 * Dictionary of custom errors for the robot
 * Basic error: class extends RobotError {};
 * Child error: class extends this.Super {};
 * Extra error: class extends this.Super {
        constructor(options = {}) {
            super(options);
            ...
        }
    }
 */
class Errors {
    Access = class extends RobotError { }

    access = {
        Blocked: class extends this.Access { },
        Captcha: class extends this.Access { },
        MultiFactor: class extends this.Access { },
        RateLimit: class extends this.Access { },
    }

    Login = class extends RobotError { }

    login = {
        Authentication: class extends this.Login { },
        InvalidUsername: class extends this.Login { },
        InvalidPassword: class extends this.Login { },
    }

    Network = class extends RobotError { }

    network = {
        ConnectionAborted: class extends this.Network { },
    }

    Retry = class extends RobotError {
        retry = true;
    }

    retry = {
        Step: class extends this.Retry {
            /** @param {RobotErrorOptions & {step: object, queryInput: boolean}} options */
            constructor(options) {
                super(options);
                this.step = options.step;
                this.queryInput = options.queryInput;
                this.message = `Retry step ${this.step && ` ${this.step.name}`}`;
            }
        },
        Task: class extends this.Retry {
            /** @param {RobotErrorOptions & {task: object, queryInput: boolean}} options */
            constructor(options) {
                super(options);
                this.task = options.task;
                this.queryInput = options.queryInput;
                this.message = `Retry task ${this.task && ` ${this.task.name}`}`;
            }
        },
    }

    Silent = class extends RobotError {
        silent = true;
    }

    Status = class extends RobotError {
        /** @param {RobotErrorOptions & {statusCode: number}} options */
        constructor(options) {
            super(options);
            this.message = options.statusCode ?
                `Received response with status ${options.statusCode}` :
                'Received response with error status';
        }
    }

    session = {
        Retain: class extends RobotError {
            /** @param {RobotErrorOptions & {message: string}} options */
            constructor(options) {
                super(options);
                this.message = `Retain session: ${options.message}`;
            }

            retainSession = true;
        },
        Retire: class extends RobotError {
            /** @param {RobotErrorOptions & {message: string}} options */
            constructor(options) {
                super(options);
                this.message = `Retire session: ${options.message}`;
            }

            retireSession = true;
        },
        Rotate: class extends RobotError {
            /** @param {RobotErrorOptions & {message: string}} options */
            constructor(options) {
                super(options);
                this.message = `Rotate session: ${options.message}`;
            }

            retry = true;
            rotateSession = true;
        },
    }

    Timeout = class extends RobotError { }

    timeout = {
        PageLoad: class extends this.Timeout { },
        Response: class extends this.Timeout { },
        Selector: class extends this.Timeout { },
    }

    Verification = class extends RobotError {
        message = this.message || 'Failed to verify result success';
    }

    RetryLogin = class extends RobotError {
        /** @param {RobotErrorOptions & {requestSecrets: boolean}} options */
        constructor(options) {
            super(options);
            this.requestSecrets = options.requestSecrets;
            this.message = `Retry login ${(options.requestSecrets && 'with new credentials') || ''}`;
        }

        retry = true;
    }

    Unknown = class extends RobotError {
        message = this.message || 'ATTENTION --- UNKNOWN ERROR DETECTED!';
    }

    ProcessPatterns = class extends RobotError {
        handler = context => {
            // handle patterns
        }
    }
}

module.exports = {
    RobotError,
    errors: new Errors(),
};
