const Apify = require('apify');
const path = require('path');
const {sleep} = Apify.utils;

const log = require('./tools/log');

const {
    getInputId
} = rootRequire('./config');

const {
    PUPPETEER
} = require('./consts');

const {
    Options,
} = require('./create');

const {
    initEventLoggers,
    decoratePage,
    startServer,
    resolveTaskTree,
    saveOutput,
    sendNotification
} = require('./tools');

// #####################################################################################################################

class Robot {
    constructor(INPUT, config) {
        this.log = log;
        this.INPUT = INPUT;
        this.config = config;

        this.page = null;
        this.browser = null;
        this.options = null;
        this.server = null;
        this.strategy = null;

        this.task = null;
        this.tasks = {};

        this.step = {};
        this.flow = {};
        this.flows = {};

        this.start = this.catch(this.start);
    }

    static check = (INPUT) => {
        const {input, tasks, target} = INPUT;

        if (typeof input !== 'object' || input === null)
            throw Error('Task input missing in actor input: input<object>');

        if (typeof tasks !== 'string' && !Array.isArray(tasks) || !tasks.length)
            throw Error('Task missing in actor input: tasks<array>');

        return this;
    };

    static build = (INPUT, config) => {
        global.tryRequire = {
            local: require('./tools').tryRequire.local(log),
            global: require('./tools').tryRequire.global(log, config.rootPath)
        };

        this.check(INPUT);

        if (INPUT.debug)
            log.setLevel(log.LEVELS.DEBUG);

        return new Robot(INPUT, config);
    };

    catch = start => async () => {
        const {INPUT, config} = this;

        try {
            return await start(INPUT, config);
        } catch (error) {
            await this.handleError({INPUT, config, error});
        }
    };

    start = async (INPUT, config) => {
        log.join.info('ROOT:', config.rootPath);
        const {input, tasks: taskNames, target} = INPUT;

        const configTasks = config.tasks ? config.tasks : config.getTasks(target);
        const tasks = resolveTaskTree(configTasks, taskNames);
        log.info('Task list from task tree:');
        tasks.flatMap(task => log.default(task));

        input.id = getInputId(input);
        // extendLog(log, input.id);
        log.default({target});
        log.redact.object(INPUT);
        const options = Options({INPUT, input, config});
        log.redact.object(options);
        this.options = options;

        const page = await this.initPage({INPUT, config, options: this.options});
        // decorate(log, APIFY.utils.log.methodsNames, decorators.log(input.id));

        let OUTPUT = config.OutputTemplate && config.OutputTemplate({INPUT, input}) || {};
        try {
            OUTPUT = await this.handleTasks({INPUT, OUTPUT, input, page, tasks, config});
        } catch (error) {
            await this.handleError({INPUT, OUTPUT, input, error, page, config});
        }

        await saveOutput({INPUT, OUTPUT, input, page});
        log.default({OUTPUT});
        await this.stop();

        return OUTPUT;
    };

    initPage = async ({INPUT: {block, stream, target}, page, config, options}) => {
        const {TARGET: {hostname}} = tryRequire.global(config.getPath.configs.robot(target)) ||
        tryRequire.global(config.getPath.configs.target(target)) ||
        {TARGET: {hostname: target}};
        log.info(hostname);

        if (!page) {
            this.browser = await Apify.launchPuppeteer(options.launchPuppeteer);
            [page] = await this.browser.pages();
            this.page = page;
        }

        if (block)
            await Apify.utils.puppeteer.blockRequests(page, options.blockRequests);

        // const singleThread = config.maxConcurrency === 1;
        const shouldStartServer = !this.server && stream;
        const server = this.server = this.server || (shouldStartServer && startServer(page, options.liveViewServer));

        initEventLoggers(page, target, hostname);
        decoratePage(page, server);

        return page;
    };

    handleTasks = async ({INPUT, OUTPUT, input, page, tasks, config}) => {
        let output = {};
        const relay = {};
        const {target} = INPUT;

        for (const task of tasks) {
            this.task = {...task};
            log.default('###################################################################################');
            log.info(`TASK [${task.name}]`);
            log.default('###################################################################################');

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
                log.default('-----------------------------------------------------------------------------------');
                log.info(`STEP [${step.name}]`);
                log.default('-----------------------------------------------------------------------------------');

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

                const context = {INPUT, OUTPUT, input, output, page, task, step, relay, target, server: this.server};

                // this.step.code = tryRequire(`../tasks/generic/${step.name}`);
                this.step.code = tryRequire.global(path.join(config.getPath.generic.steps(), step.name));
                if (this.step.code) {
                    log.join.info(`STEP: Generic handler found for step [${step.name}] of task [${task.name}]`);
                } else {
                    log.join.debug(`STEP: Generic handler not found for step [${step.name}] of task [${task.name}]`);

                    // this.step.code = tryRequire(`../tasks/targets/${target}/${step.name}`);
                    this.step.code = tryRequire.global(path.join(config.getPath.targets.steps(target), step.name));
                    if (this.step.code) {
                        log.join.info(`STEP: Target handler found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                    } else {
                        log.join.debug(`STEP: Target handler not found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                    }
                }

                if (this.step.code) {
                    output = await this.step.code(context);

                } else {
                    if (!this.flow || this.flow.name !== task.name) {
                        let Flow;
                        // Flow = tryRequire(`../tasks/generic/${task.name}`);
                        Flow = tryRequire.global(path.join(config.getPath.generic.flows(), task.name));
                        if (Flow) {
                            log.join.info(`FLOW: Generic handler found for step [${step.name}] of task [${task.name}]`);
                        } else {
                            log.join.debug(`FLOW: Generic handler not found for step [${step.name}] of task [${task.name}]`);
                            // Flow = tryRequire(`../tasks/targets/${target}`) || tryRequire(`../tasks/targets/${target}/${task.name}`);
                            Flow = tryRequire.global(config.getPath.targets.flows(target)) || tryRequire.global(path.join(config.getPath.targets.flows(target), task.name));

                            if (Flow) {
                                this.flow.target = target;
                                log.join.info(`FLOW: Target handler found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                            } else {
                                log.join.debug(`FLOW: Target handler not found for step [${step.name}] of task [${task.name}] for target [${target}]`);
                            }
                        }

                        if (!Flow)
                            throw Error(`Handler not found for step [${step.name}] of task [${task.name}]`);

                        this.flow.name = task.name;
                        const flow = new Flow(context);
                        flow.step = step;
                        this.flow.code = flow;
                        this.flows[task.name] = this.flow;
                    }

                    this.flow.step = this.flow[step.name];

                    if (this.flow.code[step.name]) {
                        const line = this.flow.target ?
                            `FLOW: Handler found for step [${step.name}] of task [${task.name}] in flow [${task.name}] on target [${this.flow.target}]` :
                            `FLOW: Handler found for step [${step.name}] of task [${task.name}] in flow [${task.name}]`;
                        log.join.debug(line);
                    }

                    output = await this.flow.code[step.name](context);
                }

                if (typeof output !== 'object') {
                    log.join.warning('STEP: output is not an object', output);
                    output = {};
                }

                OUTPUT = {
                    ...OUTPUT,
                    ...output
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

    handleError = async ({INPUT, OUTPUT, input, error, page, config}) => {
        if (OUTPUT) {
            await saveOutput({INPUT, OUTPUT, input, page});
        } else {
            const {channel} = config.SLACK;

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
        }

        throw error;
    };

    stop = async () => {
        if (this.browser)
            await this.browser.close().catch(error => {
                log.debug('Failed to close browser');
            });

        if (this.server) {
            await sleep(this.options.liveViewServer.snapshotTimeoutSecs || 3 * 1000);
            await this.server.serve(this.page);
            await sleep(5 * 1000);
        }
    };
}

module.exports = Robot;
