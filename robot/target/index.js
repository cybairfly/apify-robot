const Config = require('./config');
const log = require('../tools/log');

// #####################################################################################################################

class Target {
    constructor(setup, target) {
        this.name = target;
        this.setup = setup;

        this._steps = {};
        this._step = null;

        this.flows = {
            path: setup.getPath.targets.flows(target)
        }
    }

    get step() {
        return this._step;
    }

    set step(step) {
        this._step = step;
        this._steps[step.name] = step;
    }

    getFlow = task => tryRequire.global(this.flows.path) || tryRequire.global(`${this.flows.path}/${task}`);

    static get tasks() {
        if (!this._tasks)
            return null;

        return this._tasks
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

            return pool
        }, {});

        log.info('Original step order:');
        log.object.info(originalStepOrder);

        const adaptedTasks = tasks.map(task => {
            const parsedOrder = Array.isArray(order) ? order : order[task.name];
            const sortedSteps = this.sortStepsByList(parsedOrder, task.steps);

            return {
                ...task,
                steps: sortedSteps
            }
        });

        const adaptedStepOrder = adaptedTasks.reduce((pool, next) => {
            pool[next.name] = next.steps.map(step => step.name);

            return pool
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
