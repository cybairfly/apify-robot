const Config = require('./config');
const log = require('../tools/log');

// #####################################################################################################################

class Target {
    constructor(...[, robot]) {
        this.name = robot.target;
        this.setup = robot.setup;
        this._robot = robot;

        this._steps = {};
        this._step = null;
    }

    get step() {
        return this._step;
    }

    set step(step) {
        if (step.name) {
            this._step = step;
            this._steps[step.name] = step;
        } else {
            log.default('~'.repeat(100));
            log.info(`STEP [${step}]`);
            log.default('~'.repeat(100));
        }
    }

    get robot() {
        log.warning('Accessing robot internals at runtime. Prefer using target context if possible!');
        return this._robot;
    }

    set robot(robot) {
        this._robot = robot;
    }

    getFlow = task =>
        tryRequire.global(this.setup.getPath.targets.flows(this.name))
        || tryRequire.global(`${this.setup.getPath.targets.flows(this.name)}/${task}`);

    static get tasks() {
        if (!this._tasks)
            return null;

        return this._tasks;
    }

    static set tasks(tasks) {
        if (!this.adaptTasks)
            return null;

        this._tasks = this.adaptTasks(tasks);
    }

    static Config = Config;

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
}

module.exports = Target;
