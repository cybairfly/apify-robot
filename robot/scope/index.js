const Config = require('./config');
const log = require('../tools/log');

// #####################################################################################################################

/**
* @typedef {import('@types/puppeteer').Page} page
* @typedef {{
    * INPUT: {
        * target: String,
        * tasks: Array,
        * retry: Number,
        * abort: Boolean,
        * block: Boolean,
        * debug: Boolean,
        * stream: Boolean,
        * session: Boolean,
        * stealth: Boolean
    * },
    * OUTPUT: {any},
    * input: Object,
    * output: Object,
    * page: page,
    * relay: Object,
    * server: {
        * ws: {
            * send: (message: String) => message: String,
            * cast: (message: String) => message: String
        * },
        * http: {},
        * live: {}
    * }
    * }} RobotContext
*/

class Scope {
    /**
     * Generic scope for either generic or target dependent steps to be executed by the robot
     * @param {RobotContext} context
     * @param {*} robot
     */
    constructor(context, robot) {
        log.default('|'.repeat(100));
        console.log(`Target: ${this.constructor.name}`);
        log.default('|'.repeat(100));

        this.context = context;

        const {
            INPUT,
            OUTPUT,
            input,
            page,
            relay,
            server,
            task = null,
            step = null,
            output = null,
        } = context;

        this.INPUT = INPUT;
        this.OUTPUT = OUTPUT;
        this.input = input;
        this.page = page;
        this.relay = relay;
        this.server = server;

        this.name = robot.target;
        this.setup = robot.setup;
        this.tasks = this.constructor.tasks;
        this._robot = robot;

        this._task = {};
        this._step = {};
        this._output = {};
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

    /**
     * @returns {{output: Object}}
     */
    get task() {
        // log.warning('Accessing robot internals at runtime (task)');
        return this._task;
    }

    set task(task) {
        if (!task || typeof task !== 'object') {
            log.error('Ignoring attempt to override task object at runtime');
            return;
        }

        this._task = task;
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
        return this._step;
    }

    set step(step) {
        if (!step || typeof step !== 'object') {
            log.error('Ignoring attempt to override step object at runtime');
            return;
        }

        this._step = step;
        // this._steps[step.name] = step;
    }

    get output() {
        return this._output;
    }

    set output(output) {
        if (!output || typeof output !== 'object') {
            log.warning('Return from or attach an object to task step to modify output.');
            return;
        }

        this._output = output;
    }

    get robot() {
        log.warning('Accessing robot internals at runtime. Prefer using scope context if possible!');
        return this._robot;
    }

    set robot(robot) {
        if (!robot || typeof robot !== 'object') {
            log.error('Ignoring attempt to override robot instance at runtime');
            return;
        }

        this._robot = robot;
    }

    will(text) {
        if (typeof text !== 'string') {
            log.error('Custom steps only accept step name as an argument');
            return;
        }

        // TODO fire custom event?
        log.default('-'.repeat(100));
        log.info(`NEXT [${text}]`);
        log.default('-'.repeat(100));
    }

    getFlow = task =>
        tryRequire.global(this.setup.getPath.targets.flows(this.name))
        || tryRequire.global(`${this.setup.getPath.targets.flows(this.name)}/${task}`);
}

module.exports = Scope;
