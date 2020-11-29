const Apify = require('apify');
const R = require('ramda');
const path = require('path');

const {sleep} = Apify.utils;

const consts = require('./public/consts');
const tools = require('./public/tools');
const log = require('./tools/log');

const Setup = require('./setup');
const Target = require('./target');
const TargetConfig = require('./target/config');

const {
    PUPPETEER,
} = require('./consts');

const {
    Options,
} = require('./create');

const {
    getBrowserPool,
} = require('./tools/evasion/fpgen/src/main');

const {
    getProxyConfiguration,
    initEventLoggers,
    decoratePage,
    startServer,
    transformTasks,
    resolveTaskTree,
    saveOutput,
    sendNotification,
} = require('./tools');

// #####################################################################################################################

class Robot {
    constructor(INPUT, setup) {
        this.log = log;
        this.INPUT = INPUT;
        this.OUTPUT = null;
        this.input = INPUT.input;
        this.setup = setup;
        this.target = INPUT.target;
        this.OUTPUTS = this.setup.OUTPUTS;
        this.isRetry = false;
        this.context = {};

        this.page = null;
        this.browser = null;
        this.browserPool = null;
        this.options = null;
        this.session = null;
        this.sessionId = null;
        this.sessionPool = null;
        this.server = null;
        this.strategy = null;

        this.step = null;
        this.task = null;
        this.tasks = {};
        this.flow = null;
        this.flows = {};
        this.relay = {};

        this.retry = this.catch(this.retry);
        this.saveOutput = saveOutput;
    }

    static Setup = Setup;

    static Target = Target;

    static TargetConfig = TargetConfig;

    static consts = consts;

    static tools = tools;

    static transformTasks = transformTasks;

    static route = rootPath => {
        this.route = rootPath;

        return this;
    }

    static check = INPUT => {
        if (!INPUT)
            throw Error('INPUT not found. Check input before building robot: Robot.check(INPUT).build(setup).start()');

        // TODO json validation
        const {input, tasks, target} = INPUT;

        if (typeof input !== 'object' || input === null)
            throw Error('Task input missing in actor input: input<object>');

        if (typeof tasks !== 'string' && !Array.isArray(tasks) || !tasks.length)
            throw Error('Task missing in actor input: tasks<array>');

        this.INPUT = INPUT;

        return this;
    };

    static build = setup => {
        if (!this.route)
            throw Error('Route not found. Provide project root path before building robot: Robot.route(route).check(INPUT).build(setup).start()');

        if (!this.INPUT)
            throw Error('INPUT not found. Check input before building robot: Robot.route(route).check(INPUT).build(setup).start()');

        this.setup = setup;
        this.setup.rootPath = this.route;
        const {debug, target} = this.INPUT;

        global.tryRequire = {
            local: tools.tryRequire.local(log),
            global: tools.tryRequire.global(log, this.route),
        };

        if (debug)
            log.setLevel(log.LEVELS.DEBUG);

        if (target) {
            const targetSetup = global.tryRequire.global(setup.getPath.targets.setup(target)) || {};
            this.setup = R.mergeDeepRight(setup, targetSetup);
        }

        return new Robot(this.INPUT, this.setup);
    };

    catch = retry => async () => {
        const {INPUT, setup} = this;

        try {
            return await retry(this);
        } catch (error) {
            await this.stop();

            if (INPUT.retry) {
                INPUT.retry--;
                this.isRetry = true;
                log.error(error.message);
                log.error(error.stack);

                log.default('◄'.repeat(100));
                log.info(`RETRY [R-${INPUT.retry}]`);
                log.default('◄'.repeat(100));

                return await this.retry(this);
            }

            await this.handleError(this, error);
        }
    };

    retry = async () => {
        this.page = await this.initPage(this);
        this.OUTPUT = await this.handleTasks(this);

        return this.OUTPUT;
    };

    start = async () => {
        const {INPUT, setup} = this;

        log.join.info('ROOT:', setup.rootPath);
        const {input, tasks: taskNames, target, session, stealth} = INPUT;
        const setupTasks = setup.tasks ? setup.tasks : setup.getTasks(target);

        if (target) {
            this.Target = tryRequire.global(`./${setup.getPath.targets.target(target)}`);
            this.target = this.Target ? new this.Target(setup, target, this) : new Robot.Target(setup, target, this);

            if (this.target.adaptTasks)
                this.target.tasks = setupTasks;
        }

        const bootTasks = transformTasks(this.Target.tasks || setupTasks);
        const tasks = this.tasks = resolveTaskTree(bootTasks, taskNames);

        if (!this.isRetry) {
            log.info('Task list from task tree:');
            tasks.flatMap(task => log.default(task));
        }

        if (session) {
            this.sessionId = Apify.isAtHome() ?
                setup.getProxySessionId.apify({INPUT, input}) :
                setup.getProxySessionId.local({INPUT, input});
        }

        if (stealth) {
            this.sessionPool = await Apify.openSessionPool();
            this.session = await this.sessionPool.getSession(session && this.sessionId);
        }

        input.id = await setup.getInputId(input);
        if (!this.isRetry) log.redact.object(INPUT);
        const options = this.options = Options({INPUT, input, setup});
        if (!this.isRetry) log.redact.object(options);
        this.proxyConfig = await getProxyConfiguration(this);

        this.OUTPUT = setup.OutputTemplate && setup.OutputTemplate({INPUT, input}) || {};
        this.OUTPUT = await this.retry(this);

        await saveOutput({...this, ...{}});
        log.default({OUTPUT: this.OUTPUT});
        await this.stop();
    }

    initPage = async ({INPUT: {block, target, stream, stealth}, setup}, page) => {
        const source = tryRequire.global(setup.getPath.targets.config(target)) || tryRequire.global(setup.getPath.targets.setup(target)) || {};
        const url = source.TARGET && source.TARGET.url;

        if (!this.isRetry && url) log.default({url});

        if (!page) {
            if (stealth) {
                this.browserPool = await getBrowserPool(this.proxyConfig, this.session);
                this.page = page = await this.browserPool.newPage();
            } else {
                const proxyUrl = this.proxyConfig.newUrl(this.sessionId);
                const options = {...this.options.launchPuppeteer, proxyUrl};
                this.browser = await Apify.launchPuppeteer(options);
                [page] = await this.browser.pages();
                this.page = page;
            }
        }

        if (block && !stealth)
            await Apify.utils.puppeteer.blockRequests(page, this.options.blockRequests);

        // const singleThread = setup.maxConcurrency === 1;
        const shouldStartServer = !this.server && stream;
        const server = this.server = this.server || (shouldStartServer && startServer(page, setup, this.options.liveViewServer));

        initEventLoggers(page, target, url);
        decoratePage(page, server);

        return page;
    };

    handleTasks = async ({INPUT, OUTPUT, input, page, setup}) => {
        let output = {};
        const {tasks, context} = this;
        const {target} = INPUT;
        const relay = this.relay = {};

        for (const task of tasks) {
            this.task = {...task};
            log.default('#'.repeat(100));
            log.info(`TASK [${task.name}]`);
            log.default('#'.repeat(100));

            this.task.init = !task.init || task.init({INPUT, OUTPUT, input, output, relay});
            this.task.skip = task.skip && task.skip({INPUT, OUTPUT, input, output, relay});

            if (!this.task.init) {
                log.join.info(`Skipping task [${task.name}] on test ${task.init}`);
                continue;
            }

            if (this.task.skip) {
                log.join.info(`Skipping task [${task.name}] on test ${task.skip}`);
                continue;
            }

            for (const step of task.steps) {
                this.step = {...step};
                log.default('-'.repeat(100));
                log.info(`STEP [${step.name}]`);
                log.default('-'.repeat(100));

                // TODO consider nested under actor/robot
                this.context = {
                    INPUT,
                    OUTPUT,
                    input,
                    output,
                    page,
                    task,
                    step,
                    relay: this.relay,
                    server: this.server,
                };

                this.step.init = !step.init || step.init({INPUT, OUTPUT, input, output, relay});
                this.step.skip = step.skip && step.skip({INPUT, OUTPUT, input, output, relay});

                if (!this.step.init) {
                    log.join.info(`Skipping step [${step.name}] of task [${task.name}] on test ${step.init}`);
                    continue;
                }

                if (this.step.skip) {
                    log.join.info(`Skipping step [${step.name}] of task [${task.name}] on test ${step.skip}`);
                    continue;
                }

                this.step.code = tryRequire.global(path.join(setup.getPath.generic.steps(), step.name));
                if (this.step.code)
                    log.join.info(`STEP: Generic handler found for step [${step.name}] of task [${task.name}]`);
                else {
                    log.join.debug(`STEP: Generic handler not found for step [${step.name}] of task [${task.name}]`);

                    this.step.code = tryRequire.global(path.join(setup.getPath.targets.steps(target), step.name));
                    if (this.step.code)
                        log.join.info(`STEP: Target handler found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                    else
                        log.join.debug(`STEP: Target handler not found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                }

                if (this.step.code)
                    output = await this.step.code(this.context, this.target);

                else {
                    this.flow = this.flow || this.target;

                    if (!this.flow[step.name]) {
                        let Flow;
                        // Flow = tryRequire(`../tasks/generic/${task.name}`);
                        Flow = tryRequire.global(path.join(setup.getPath.generic.flows(), task.name));

                        if (Flow)
                            log.join.info(`FLOW: Generic handler found for step [${step.name}] of task [${task.name}]`);
                        else {
                            log.join.debug(`FLOW: Generic handler not found for step [${step.name}] of task [${task.name}]`);
                            // Flow = target.flow[task.name] ? new target.flow[task.name] : new target.flow;
                            Flow = this.target.getFlow(task.name);

                            if (Flow)
                                log.join.info(`FLOW: Target handler found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                            else
                                log.join.debug(`FLOW: Target handler not found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                        }

                        if (!Flow && !this.target[step.name])
                            throw Error(`Handler not found for step [${step.name}] of task [${task.name}]`);

                        const flow = this.flow = new Flow(this.context);
                        flow.target = target;
                        flow.name = task.name;
                        // flow.code = flow;
                        flow.step = flow[step.name];
                        this.flows[task.name] = flow;

                        if (!this.flow[step.name])
                            throw Error(`Handler not found within flow for step [${step.name}] of task [${task.name}]`);

                        const line = this.flow.target ?
                            `FLOW: Handler found for step [${step.name}] of task [${task.name}] in flow [${task.name}] on target [${this.flow.target}]` :
                            `FLOW: Handler found for step [${step.name}] of task [${task.name}] in flow [${task.name}]`;
                        log.join.debug(line);
                    }

                    log.join.info(`FLOW: Target handler found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                    output = await this.flow[step.name](this.context, this.target);
                }

                if (!output || typeof output !== 'object') {
                    log.join.warning('STEP: ignoring step output (not an object)', output);
                    output = {};
                }

                OUTPUT = {
                    ...OUTPUT,
                    ...output,
                };

                this.step.done = !step.done || step.done({INPUT, OUTPUT, input, output, relay});
                this.step.stop = step.stop && step.stop({INPUT, OUTPUT, input, output, relay});

                if (this.step.stop) {
                    log.join.warning(`Breaking on step [${step.name}] of task [${task.name}] on test ${step.stop}`);
                    break;
                }

                if (!this.step.done) {
                    log.join.error(`Failure on step [${step.name}] of task [${task.name}] on test ${step.done}`);
                    this.task.done = false;
                    break;
                }
            }

            this.task.done = !task.done || task.done({INPUT, OUTPUT, input, output, relay});
            this.task.stop = task.stop && task.stop({INPUT, OUTPUT, input, output, relay});

            if (this.task.stop) {
                log.join.warning(`Breaking on task [${task.name}] on test ${task.stop}`);
                break;
            }

            // continue to other tasks unless stopped explicitly
            // if (!this.task.done) {
            //     log.join.error(`Failure on task [${task.name}] on test [${task.done}]`);
            //     this.task.done = false;
            //     break;
            // }
        }

        return OUTPUT;
    };

    handleError = async ({INPUT, OUTPUT, input, page, setup}, error) => {
        if (Object.keys(OUTPUT).length)
            await saveOutput({INPUT, OUTPUT, input, page});

        const {channel} = setup.SLACK;

        if (!INPUT.debug) {
            if (channel) {
                await sendNotification({INPUT, OUTPUT, channel, error});
                console.error('---------------------------------------------------------');
                console.error('Error in robot - support notified to update configuration');
                console.error('---------------------------------------------------------');
            } else {
                console.error('---------------------------------------------------------------');
                console.error('Error in robot - please contact support to update configuration');
                console.error('---------------------------------------------------------------');
            }
        }

        throw error;
    };

    stop = async () => {
        if (this.browserPool) {
            await this.browserPool.retire();
            await this.browserPool.destroy();
        }

        if (this.browser) {
            await this.browser.close().catch(error => {
                log.debug('Failed to close browser');
            });
        }

        if (this.server) {
            await sleep(this.options.liveViewServer.snapshotTimeoutSecs || 3 * 1000);
            await this.server.serve(this.page);
            await sleep(5 * 1000);
        }
    };
}

module.exports = Robot;
