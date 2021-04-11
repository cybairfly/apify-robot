/**
 * @typedef {import('./d').RobotErrorOptions} RobotErrorOptions
 */

/* eslint-disable lines-between-class-members */
module.exports = class RobotError extends Error {
    #name = '';
    #type = '';
    #message = '';

    /**
     * Custom errors for robot
     * @param {RobotErrorOptions} options
     */
    constructor(options = {}) {
        super(options.message);
        this.#message = options.message;
        this.#name = options.name;
        this.#type = options.type;

        if (options.error)
            this.error = options.error;

        if (options.retry)
            this.retry = options.retry;

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor);

        Object.entries(options).forEach(([key, value]) => this[key] = value);
    }

    get name() {
        return this.#name
        || (this.constructor.name === 'RobotError' && this.error && this.error.constructor.name)
        || (this.constructor.name.toLowerCase().includes('error') ? this.constructor.name : `${this.constructor.name}Error`);
    }

    set name(name) {
        this.#name = this.name || name;
    }

    get type() {
        return this.#type || this.constructor.name;
    }

    set type(type) {
        this.#type = this.type || type;
    }

    get message() {
        return this.#message || (this.constructor.name === 'RobotError' && this.error && this.error.message) || '';
    }

    set message(message) {
        this.#message = this.message || message;
    }

    toJSON = () => ({ ...this});
};
