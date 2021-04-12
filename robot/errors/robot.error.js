/**
 * @typedef {import('./d').RobotErrorOptions} RobotErrorOptions
 */

/* eslint-disable lines-between-class-members */
module.exports = class RobotError extends Error {
    #name = '';
    #type = '';
    #message = '';
    #error = null;
    #retry = false;

    /**
     * Custom errors for robot
     * @param {RobotErrorOptions} options
     */
    constructor(options = {}) {
        super(options.message);
        this.#name = options.name;
        this.#type = options.type;
        this.#message = options.message;

        if (options.error)
            this.#error = options.error;

        if (options.retry)
            this.#retry = options.retry;

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor);

        Object.entries(options).forEach(([key, value]) => this[key] = value);
    }

    get name() {
        return this.#name
        || (this.constructor.name === 'RobotError' && ((this.error && this.error.constructor.name) || 'Robot.Error'))
        || (this.constructor.name !== 'RobotError' && this instanceof RobotError && `Robot.Error.${this.constructor.name}`)
        || (this.constructor.name.toLowerCase().includes('error') ? this.constructor.name : `${this.constructor.name}Error`);
    }

    get type() {
        return this.#type || this.constructor.name;
    }

    get message() {
        return this.#message || (this.constructor.name === 'RobotError' && this.error && this.error.message) || '';
    }

    get error() {
        return this.#error || null;
    }

    get retry() {
        return this.#retry || false;
    }

    set name(name) {
        this.#name = this.name || name;
    }

    set type(type) {
        this.#type = this.type || type;
    }

    set message(message) {
        this.#message = this.message || message;
    }

    set error(error) {
        return this.#error || error;
    }

    set retry(retry) {
        return this.#retry || retry;
    }

    toJSON = () => {
        const output = {...this};
        output.name = this.name;
        output.type = this.type;

        if (this.message)
            output.message = this.message;

        if (this.error)
            output.error = this.error instanceof RobotError ? JSON.stringify(this.error) : this.error.toString();

        if (this.retry)
            output.retry = this.retry;

        return output;
    };
};
