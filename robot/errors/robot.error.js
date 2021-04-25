/**
 * @typedef {import('./d').RobotErrorOptions} RobotErrorOptions
 */
const SKIP_KEYS = ['name', 'type', 'data', 'error', 'retry'];

/* eslint-disable lines-between-class-members */
module.exports = class RobotError extends Error {
    #data = null;
    #type = null;
    #cause = null;
    #retry = false;

    /**
     * Custom robot error with additional properties
     * Rethrow a wrapped error - Robot.Error({error})
     * Rethrow as custom error - extend Robot.Error
     *
     * Both cases support custom properties unless
     * overloaded by the child error outside its ctor
     *
     * Prefer using the pre-defined data property for
     * any extraneous properties besides the defined.
     *
     * Log to print custom error or stringify to send
     * all its extra properties outside of the robot.
     * @param {RobotErrorOptions} options
     */
    constructor(options = {}) {
        super(options.message);
        this.name = options.name;
        this.#type = options.type;

        Object
            .entries({
                ...options.error,
                ...options,
            })
            .filter(([key]) => !SKIP_KEYS
                .some(item => key === item))
            .forEach(([key, value]) => this[key] = value);

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, this.constructor);

        if (options.error) {
            if (options.error.data)
                this.data = options.error.data;

            if (this.constructor.name !== 'RobotError')
                this.#cause = options.error;
            else {
                this.#cause = options.error.cause;
                this.name = options.name && options.error.name ?
                    `${options.name} ◄ ${options.error.name}` :
                    (options.name || options.error.name);

                this.message = options.message && options.error.message ?
                    `${options.message} ◄ ${options.error.message.split('\n', 1)[0]}` :
                    (options.message || options.error.message);

                if (options.stack)
                    this.stack = options.error.stack;

                if (options.error.retry)
                    this.#retry = options.error.retry;
            }
        }

        // extend or overwrite cause error data maybe
        if (options.data)
            this.data = options.data;

        // overwrite cause error retry flag maybe
        if (options.retry !== undefined)
            this.#retry = options.retry;

        this.name = this.name || this.#getName();
    }

    set data(data = {}) {
        if (typeof data !== 'object') return;
        this.#data = {...this.#data, ...data};
    } get data() {
        return this.#data || null;
    }

    set type(type) {
        this.#type = this.type || type;
    } get type() {
        return this.#type || this.constructor.name;
    }

    set cause(error) {
        this.#cause = this.#cause || error;
    } get cause() {
        return this.#cause || null;
    }

    set retry(retry) {
        this.#retry = this.#retry || retry;
    } get retry() {
        return this.#retry || false;
    }

    #getName = (chain = [], child = this.constructor) => {
        if (child.name === 'RobotError')
            return chain.length ? `Robot.Error.${chain.join('.')}` : 'Robot.Error';

        return this.#getName([child.name, ...chain], Object.getPrototypeOf(child));
    }

    toJSON() {
        const output = {...this};
        output.name = this.name;
        output.type = this.type;

        if (this.data)
            output.data = this.data;

        if (this.retry !== undefined)
            output.retry = this.retry;

        if (this.message)
            output.message = this.message;

        if (this.cause) {
            output.cause = this.cause instanceof RobotError ?
                JSON.parse(JSON.stringify(this.cause)) :
                this.cause.toString();
        }

        return Reflect.ownKeys(output).length ? output : null;
    }
};
