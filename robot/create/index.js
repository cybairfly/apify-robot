const Human = require('apify-human');

const log = require('../logger');
const {curryDebug} = require('../tools');
const {preloadMatchPattern, preloadIteratePatterns} = require('../public/tools/patterns');

class Context {
    #robot;

    constructor({input, output, page, task, step, state, server, session, browserPool, sessionPool}) {
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
    }

    set robot(robot) {
        this.#robot = robot;
    }

    get robot() {
        log.warning('Robot internals backdoor is being accessed. Use with caution and only when necessary.')
        
        return this.#robot;
    }

    get human() {
            this.#robot.human = this.#robot.human || new Human(this.page, {...this.input, motion: {enable: false}});

            return this.#robot.human;
    }
}

module.exports = Context;