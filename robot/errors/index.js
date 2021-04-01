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
            this.prop = options.prop;
            ...
        }
    }
 */
class Errors {
    Access = class extends RobotError {
        message = 'Access issue on requested resource';
    }

        MultiFactor = class extends this.Access {
            message = 'Multifactor authentication required';
        }

        RateLimit = class extends this.Access {
            message = 'Resource has been rate limited';
        }

    Network = class extends RobotError {
        message = 'Network layer error (check proxy)';
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
}

module.exports = {
    RobotError,
    errors: new Errors(),
};
