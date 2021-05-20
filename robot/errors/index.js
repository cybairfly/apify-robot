/**
 * @typedef {import('./d').RobotErrorOptions} RobotErrorOptions
 * @typedef {import('./d').StatusErrorOptions} StatusErrorOptions
 */

/* eslint-disable max-classes-per-file */
/* eslint-disable lines-between-class-members */
const RobotError = require('./robot.error');

/**
 * Dictionary of custom errors for the robot
 * Basic error: class extends RobotError {};
 * Child error: class extends this.super {};
 * Extra error: class extends this.super {
        constructor(options = {}) {
            super(options);
            ...
        }
    }
 */
class Errors {
    Access = class extends RobotError {
        message = 'Access issue on requested resource';
    }

    access = {
        Blocked: class extends this.Access {
            message = 'Access has been blocked';
        },
        MultiFactor: class extends this.Access {
            message = 'Multifactor authentication required';
        },
        RateLimit: class extends this.Access {
            message = 'Resource has been rate limited';
        },
    }

    Login = class extends RobotError {
        message = 'Error occured during login attempt';
    }

    login = {
        Authentication: class extends this.Login {
            message = 'Login failed using provided credentials';
        },
        InvalidUsername: class extends this.Login {
                message = 'Login failed using provided username';
        },
        InvalidPassword: class extends this.Login {
                message = 'Login failed using provided password';
        },
    }

    Network = class extends RobotError {
        message = 'Network layer error (check proxy)';
    }

    network = {
        ConnectionAborted: class extends this.Network {
            message = 'Connection aborted by target';
        },
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
        },
        Retire: class extends RobotError {
            /** @param {RobotErrorOptions & {message: string}} options */
            constructor(options) {
                super(options);
                this.message = `Retire session: ${options.message}`;
            }

            retireSession = true;
        },
    }

    Timeout = class extends RobotError {
        message = 'Timeout during requested action';
    }

    timeout = {
        PageLoad: class extends this.Timeout {
            message = 'Page failed to load within timeout';
        },
        Request: class extends this.Timeout {
            message = 'Failed to receive response before timeout';
        },
    }

    Verification = class extends RobotError {
        message = 'Failed to verify result success';
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
