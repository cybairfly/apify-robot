/**
 * @typedef {import('./d').RobotErrorOptions} RobotErrorOptions
 */

/* eslint-disable lines-between-class-members */
module.exports = class RobotError extends Error {
    #name = '';
    #type = '';

    /**
     * Custom errors for robot
     * @param {RobotErrorOptions} options
     */
    constructor(options = {}) {
        super(options.message);
        this.#name = options.name;
        this.#type = options.type;
        this.retry = options.retry || false;

        Object.entries(options).forEach(([key, value]) => this[key] = value);
    }

    get name() {
        return this.#name || this.constructor.name.toLowerCase().includes('error') ?
            this.constructor.name :
            `${this.constructor.name}Error`;
    }

    set name(name) {
        this.#name = name;
    }

    get type() {
        return this.#type || this.constructor.name + 2;
    }

    set type(type) {
        this.#type = type;
    }
};
