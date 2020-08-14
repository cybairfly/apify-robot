const Apify = require('apify');
const {sleep} = Apify.utils;

const {
    URLS,
    TARGET,
    STRINGS,
    PATTERNS,
    SELECTORS,
    PREDICATES
} = require('../config/target');

const {
    OUTPUTS
} = require('../../../../setup');

const {
    PUPPETEER,
    TIMEOUTS,
} = require('apify-robot/robot/consts');

const robotTools = require('apify-robot/robot/tools');
const targetTools = require('../../../../tools');
const log = require('../../../../robot/tools/log');

// #####################################################################################################################

class MockHost {
    constructor(context) {
        this.relay = {};
        this._steps = {};
        this._step = null;
        this._context = context;
    }

    get step() {
        return this._step;
    }

    set step(step) {
        this._step = step;
        this._steps[step.name] = step;
    }

    mockStep1 = async (context) => {};
    mockStep2 = async (context) => {};
}

module.exports = MockHost;
