/**
 * @typedef {import('../types').Robot} Robot
 * @typedef {import('../types').RobotContext} RobotContext
 */

const {
	Human,
	login
} = require('cyber-codex');

const Robot = require('../index');
const Config = require('./config');

const log = require('../logger');
const {curryDebug} = require('../tools');
const {preloadMatchPattern, preloadIteratePatterns} = require('../public/tools/patterns');
const {integrateInstance} = require('../tools/hooks');

class Scope {
	#robot;
	#page;
	#task;
	#step;
	#output;
	
    /**
     * Generic scope to serve as either generic or target dependent container for runtime context to execute
     * @param {RobotContext} context
     * @param {Robot} robot
     */
    constructor(context, robot) {
		const {
			input, 
			output, 
			page, 
			task, 
			step, 
			state, 
			server, 
			session, 
			browserPool, 
			sessionPool
		} = context;

		this.Robot = robot.constructor;
        this.setup = robot.setup;
        this.input = {...input};
        this.output = output;
        this.page = page;
        this.task = task;
        this.step = step;
        this.state = state;
        this.server = server;
        this.session = session;

        this.pools = {
            browserPool,
            sessionPool,
        };

        this.events = {
            emit: 'placeholder',
            listen: 'placeholder',
        };

        this.tools = {
            debug: curryDebug(input)(page),
            matchPattern: preloadMatchPattern(page),
            iteratePatterns: preloadIteratePatterns(page),
        };
		
		this.login = login;
		this.adopt = integrateInstance;
		this.integrateInstance = integrateInstance;

        Object.entries(input.custom.context || {}).forEach(([key, value]) => this[key] = this[key] || value);
		
        // this.name = robot.target;
        // this.setup = robot.setup;
        // this.tasks = this.constructor.tasks;
        // this._robot = robot;

        // this._task = {};
        // this._step = {};
        // this._output = {};
    }
	
    static Config = Config;

    static get tasks() {
        if (!this.adaptTasks)
            return null;

        return this._tasks;
    }

    static set tasks(tasks) {
        this._tasks = this.adaptTasks ?
            this.adaptTasks(tasks) :
            tasks;
    }

    static sortSteps = order => tasks => {
        const originalStepOrder = tasks.reduce((pool, next) => {
            pool[next.name] = next.steps.map(step => step.name);

            return pool;
        }, {});

        log.info('Original step order:');
        log.object.info(originalStepOrder);

        const adaptedTasks = tasks.map(task => {
            const parsedOrder = Array.isArray(order) ? order : order[task.name];
            const sortedSteps = this.sortStepsByList(parsedOrder, task.steps);

            return {
                ...task,
                steps: sortedSteps,
            };
        });

        const adaptedStepOrder = adaptedTasks.reduce((pool, next) => {
            pool[next.name] = next.steps.map(step => step.name);

            return pool;
        }, {});

        log.info('Adapted step order:');
        log.object.info(adaptedStepOrder);

        return adaptedTasks;
    };

    static sortStepsByList = (list = [], steps) => steps.sort((stepA, stepB) =>
        list.indexOf(stepA.name) >= 0 && list.indexOf(stepB.name) >= 0 ?
            list.indexOf(stepA.name) - list.indexOf(stepB.name) : 0);

    static replaceSteps = tasks => {
        // tasks.query.steps[tasks.query.steps.findIndex(step => step.name === 'startPayment')] = ;
        // tasks.query.steps.find(step => step.name === 'startPayment') =
        // Object.entries(tasks).find(([taskName, task]) => taskName === 'query')
    }

	/** @returns {types.page} */
    get page() {
        return this.#page;
    }

    set page(page) {
        this.#page = page;
    }

    /**
     * @returns {{output: Object}}
     */
    get task() {
        // log.warning('Accessing robot internals at runtime (task)');
        return this.#task;
    }

    set task(task) {
        if (!task || typeof task !== 'object') {
            log.error('Ignoring attempt to override task object at runtime');
            return;
        }

        this.#task = task;
    }

    /**
     * @returns {{
        * attachOutput: (output: Object) => Object;
        * output: {
            * attach: (output: Object) => Object
        * }
     * }}
     */
    get step() {
        return this.#step;
    }

    set step(step) {
        if (!step || typeof step !== 'object') {
            log.error('Ignoring attempt to override step object at runtime');
            return;
        }

        this.#step = step;
        // this.#steps[step.name] = step;
    }

    get output() {
        return this.#output;
    }

    set output(output) {
        if (!output || typeof output !== 'object') {
            log.warning('Return from or attach an object to task step to modify output.');
            return;
        }

        this.#output = output;
    }

    get robot() {
        log.warning('Accessing robot internals at runtime. Prefer using scope context if possible!');
        return this.#robot;
    }

    set robot(robot) {
        if (!robot || typeof robot !== 'object') {
            log.error('Ignoring attempt to override robot instance at runtime');
            return;
        }

        this.#robot = robot;
    }

    get human() {
		this.#robot.human = this.#robot.human || new Human(this.page, {...this.input, motion: {enable: false}});

		return this.#robot.human;
}

    will(text) {
        if (typeof text !== 'string') {
            log.error('Custom steps only accept step name as an argument');
            return;
        }

        // TODO fire custom event
        // TODO fire websocket event
        log.default(' '.repeat(100));
        log.default(`NEXT [${text}]`);
        log.default('-'.repeat(100));
    }
}

module.exports = Scope;
