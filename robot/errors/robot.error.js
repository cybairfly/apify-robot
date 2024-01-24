const {Error} = require('cyber-codex');

/* eslint-disable lines-between-class-members */
class RobotError extends Error {
	#rotateSession = false;
	#retireSession = false;

	static #modelExtras = {
		rotateSession: false,
		retireSession: false,
	};

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
     * @param {import('./types').RobotErrorOptions} options
     */
	constructor(options = {}) {
		super(options, RobotError.#modelExtras);

		if (options.rotateSession !== undefined)
			this.rotateSession = options.rotateSession;

		if (options.retireSession !== undefined)
			this.retireSession = options.retireSession;
	}

	set rotateSession(rotateSession) {
		this.#rotateSession = this.#rotateSession || rotateSession;
	} get rotateSession() {
		return this.#rotateSession || false;
	}

	set retireSession(retireSession) {
		this.#retireSession = this.#retireSession || retireSession;
	} get retireSession() {
		return this.#retireSession || false;
	}
}

module.exports = {RobotError};
