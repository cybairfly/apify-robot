/* eslint-disable no-unused-vars */
const Apify = require('apify');
const Robot = require('apify-robot');

const {
    EVENTS, 
    TIMEOUTS
} = Robot.consts;

const {
    log,
    login,
    sleep,
    getPageUrl,
    matchPattern,
    iteratePatterns,
    verifyResult,
    saveOutput,
} = Robot.tools;

const {
    URLS,
    TARGET,
    STRINGS,
    PATTERNS,
    SELECTORS,
    PREDICATES,
} = require('./config');

const {
    extractDate,
    handleMissingResponse,
} = require('./tools');

const {
    consts: {tasks, steps},
    outputs,
} = require('../../../robot');

class Example extends Robot.Target {
    // optional constructor & super
    // (automatic context bindings)
    // constructor(context, robot) {
    //     super(context, robot);
    //     this.context = context;
    // }

    [tasks.login] = ({ page, human, server, ...context } = this.context) => ({
        [steps.checkSession]: async ({ input, state, session, pools: { browserPool } } = context) => {
            // ...
            return outputs.invalidSession;
        },
        [steps.decryptSecrets]: async ({state}) => {
            // ...
            state = { username, password };
            return outputs.secretsObtained;
        },
        [steps.prepareLogin]: async ({state: { username, password }}) => {
            // ...
            return outputs.loginPrepared;
        },
        [steps.attemptLogin]: async () => {
            // ...
            return outputs.loginSuccess;
        },
    });

    /** @param {import('apify-robot').RobotContext} context */
    [tasks.action] = ({page, human, ...context}) => ({
        [steps.prepareAccount]: async () => {
            // ...
            return outputs.accountReady;
        },

        [steps.prepareAction]: async ({state} = context) => {
            // ...
            return outputs.actionPrepared;
        },

        [steps.promptAction]: async ({input: {prompt}, server} = context) => {
            // ...
            return outputs.actionApproved;
        },

        [steps.finishAction]: async ({input: {abort}} = context) => {
            // ...
            return outputs.actionComplete;
        },

        [steps.verifyAction]: async () => {
            // ...
            return outputs.actionVerified;
        },
        
        // optional custom error handling
        [steps.handleErrors]: async () => {
            this.will('handle errors, patterns and edge cases');
            const pattern = await iteratePatterns(page, PATTERNS);

            if (pattern)
                return outputs[pattern];

            throw new Robot.Error({retry: true, rotateSession: true, message: 'Unknown new error detected'});
        },
    });
}

module.exports = Example;
