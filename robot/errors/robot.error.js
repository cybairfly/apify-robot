module.exports = class RobotError extends Error {
    constructor(options = {}) {
        super(options.message);
        this._name = options.name;
        this._type = options.type;
        this.retry = options.retry;

        Object.entries(options).forEach(([key, value]) => this[key] = value);
    }

    get name() {
        return this._name || `${this.constructor.name}Error`;
    }

    set name(name) {
        this._name = name;
    }

    get type() {
        return this._type || this.constructor.name;
    }

    set type(type) {
        this._type = type;
    }
};
