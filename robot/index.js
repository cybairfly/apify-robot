const Apify = require('apify');
const R = require('ramda');
const path = require('path');

const {sleep} = Apify.utils;

const consts = require('./public/consts');
const tools = require('./public/tools');
const log = require('./tools/log');

const Setup = require('./setup');
const Scope = require('./scope');
const Target = require('./target');

const ScopeConfig = Scope.Config;
const TargetConfig = Target.Config;

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
        this.input = INPUT.input;
        this.target = INPUT.target;
        this.setup = setup;
        this.isRetry = false;
        this.retryIndex = 0;
        this.retryCount = INPUT.retry;
        // expose in target class somehow
        this.OUTPUTS = this.setup.OUTPUTS;

        this.relay = {};
        this.context = {};
        this._output = {};
        this.OUTPUT = {};

        this.page = null;
        this.browser = null;
        this.browserPool = null;
        this.options = null;
        this.session = null;
        this.sessionId = null;
        this.sessionPool = null;
        this.server = null;
        this.strategy = null;

        this.Scope = {};
        this.scope = {};
        this._step = null;
        this._task = null;
        this.tasks = {};
        this.steps = {};

        this.retry = this.catch(this.retry);
        this.saveOutput = saveOutput;
    }

    get task() {
        return this._task;
    }

    get step() {
        return this._step;
    }

    set task(task) {
        this._task = task;
    }

    set step(step) {
        this._step = step;
    }

    get output() {
        return this._output;
    }

    set output(output) {
        try {
            Object.entries(output).map(entry => {
                const [key, value] = entry;
                this._output[key] = value;
            });

            this.context.output = this.output;

            if (this.scope) {
                this.scope.output = this.output;

                if (this.scope.task)
                    this.scope.task.output = this.output;
            }
        } catch (error) {
            log.error(`Failed to set robot output: ${output}`);
        }
    }

    static Setup = Setup;

    static Scope = Scope;

    static Target = Target;

    static ScopeConfig = ScopeConfig;

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
            if (INPUT.retry > this.retryIndex) {
                if (INPUT.debug) {
                    const {OUTPUT, input, page, retryCount} = this;
                    await saveOutput({INPUT, OUTPUT, input, page, retryCount});
                }

                this.isRetry = true;
                this.retryCount--;
                this.retryIndex++;
                await this.stop();

                log.error(error.message);
                log.error(error.stack);

                log.default('◄'.repeat(100));
                log.info(`RETRY [R-${INPUT.retryCount}]`);
                log.default('◄'.repeat(100));

                return await this.retry(this);
            }

            await this.handleError(this, error);
        }
    };

    retry = async () => {
        this.tasks = await this.initTasks(this);
        this.page = await this.initPage(this);
        this.context = await this.createContext(this);
        this.OUTPUT = await this.handleTasks(this);

        return this.OUTPUT;
    };

    start = async () => {
        const {INPUT, setup} = this;
        const {input, tasks: taskNames, target, session, stealth} = INPUT;
        input.id = await setup.getInputId(input);

        if (target)
            this.Scope = tryRequire.global(`./${setup.getPath.targets.target(target)}`) || this.Scope;
        else
            this.Scope = tryRequire.global(`./${setup.getPath.generic.scope()}`) || this.Scope;

        if (session) {
            this.sessionId = Apify.isAtHome() ?
                setup.getProxySessionId.apify({INPUT, input}) :
                setup.getProxySessionId.local({INPUT, input});
        }

        if (stealth) {
            this.sessionPool = await Apify.openSessionPool();
            this.session = await this.sessionPool.getSession(session && this.sessionId);
        }

        const options = this.options = Options({INPUT, input, setup});
        this.proxyConfig = await getProxyConfiguration(this);

        if (!this.isRetry) {
            log.redact.object(INPUT);
            log.redact.object(options);
        }

        this.OUTPUT = setup.OutputTemplate && setup.OutputTemplate({INPUT, input}) || {};
        this.OUTPUT = await this.retry(this);

        await saveOutput({...this, ...{}});
        log.default({OUTPUT: this.OUTPUT});
        await this.stop();
    }

    initTasks = async ({INPUT: {target, tasks: taskNames}, setup}) => {
        const setupTasks = setup.tasks ? setup.tasks : setup.getTasks(target);

        if (this.Scope.adaptTasks)
            this.Scope.tasks = setupTasks;

        const bootTasks = transformTasks(this.Scope.tasks || setupTasks);
        const tasks = this.tasks = resolveTaskTree(bootTasks, taskNames);

        if (!this.isRetry) {
            log.info('Task list from task tree:');
            tasks.flatMap(task => log.default(task));
        }

        return this.tasks;
    };

    initPage = async ({INPUT: {block, target, stream, stealth}, page, setup}) => {
        const source = tryRequire.global(setup.getPath.targets.config(target)) || tryRequire.global(setup.getPath.targets.setup(target)) || {};
        const url = source.TARGET && source.TARGET.url;

        if (!this.isRetry && url) log.default({url});

        if (!page) {
            if (stealth) {
                const pluginOptions = this.options.browserPool && this.options.browserPool.pluginOptions || {};
                this.browserPool = await getBrowserPool(pluginOptions, this.proxyConfig, this.session);
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

    createContext = async ({INPUT, OUTPUT, input, output, page, relay, server}) => {
        // TODO consider nested under actor/robot
        this.context = {
            INPUT,
            input: Object.freeze(input),
            output: null,
            page,
            pools: {
                browserPool: 'placeholder',
                sessionPool: 'placeholder',
            },
            events: {
                emit: 'placeholder',
                listen: 'placeholder',
            },
            server: {
                ws: 'placeholder',
                http: 'placeholder',
                view: 'placeholder',
            },
            tools: {
                slack: {
                    post: 'placeholder',
                },
                // tools pre-initialized with page and other internals
                typeHuman: 'placeholder',
                matchPattern: 'placeholder',
                verifyResult: 'placeholder',
            },
            relay,
            step: null,
            task: null,
        };

        return this.context;
    }

    handleTasks = async ({INPUT, OUTPUT, input, output, page, relay, setup, tasks}) => {
        const {target} = INPUT;

        log.default('●'.repeat(100));
        console.log(`Target: ${target}`);
        log.default('●'.repeat(100));

        for (const task of tasks) {
            this.task = {...task};
            this.sync.task(task);

            log.default('■'.repeat(100));
            log.info(`TASK [${task.name}]`);
            log.default('■'.repeat(100));

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
                this.sync.step(step);

                log.default('▬'.repeat(100));
                log.info(`STEP [${step.name}] @ TASK [${task.name}]`);
                log.default('▬'.repeat(100));

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
                        log.join.info(`STEP: Target handler found for step [${step.name}] of task [${task.name}] in ${target ? 'target' : 'scope'} [${target}]`);
                    else
                        log.join.debug(`STEP: Target handler not found for step [${step.name}] of task [${task.name}] in ${target ? 'target' : 'scope'} [${target}]`);
                }

                if (this.step.code)
                    this.step.output = await this.step.code(this.context, this);

                else {
                    this.step.code = this.scope[task.name] ?
                        this.scope[task.name](this.context, this)[step.name] :
                        this.scope[step.name];

                    if (!this.step.code) {
                        this.scope = this.Scope ? new this.Scope(this.context, this) : new Robot.Scope(this.context, this);
                        this.scope.robot = this;
                        this.sync.step(step);

                        this.step.code = this.scope[task.name] ?
                            this.scope[task.name](this.context, this)[step.name] :
                            this.scope[step.name];

                        if (!this.step.code) {
                            const message = target ?
                                `TARGET: Scope handler not found for step [${step.name}] of task [${task.name}] as scope [${target}]` :
                                `SCOPE: Scope handler not found for step [${step.name}] of task [${task.name}]`;

                            log.join.debug(message);
                            throw Error(message);
                        }
                    }

                    // TODO support task scope modules to enable scope per task usage
                    // const line = target ?
                    //     `${target ? 'TARGET' : 'SCOPE'} Target scope found for step [${step.name}] of task [${task.name}] as scope [${task.name}] for target [${target}]` :
                    //     `${target ? 'TARGET' : 'SCOPE'} Generic scope found for step [${step.name}] of task [${task.name}] as scope [${task.name}]`;
                    // log.join.debug(line);

                    const message = target ?
                        `STEP: Target handler found for step [${step.name}] of task [${task.name}] in scope [${target}]` :
                        `STEP: Generic handler found for step [${step.name}] of task [${task.name}]`;

                    log.join.info(message);
                    this.step.output = await this.step.code(this.context, this);
                }

                if (this.step.output && typeof this.step.output !== 'object') {
                    log.join.warning('STEP: ignoring step output (not an object)', output);
                    this.step.output = {};
                }

                if (this.scope.step.output && typeof this.scope.step.output !== 'object') {
                    log.join.warning('STEP: ignoring step output (not an object)', output);
                    this.scope.step.output = {};
                }

                this.step.output = this.step.output || {};
                this.scope.step.output = this.scope.step.output || {};

                this.step.output = {
                    ...this.step.output,
                    ...this.scope.step.output,
                };

                this.task.output = {
                    ...this.task.output,
                    ...this.step.output,
                };

                this.output = {
                    ...this.output,
                    ...this.task.output,
                    ...this.step.output,
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

        return {
            ...OUTPUT,
            ...this.output,
        };
    };

    // TODO auto debug mode with debug buffers
    handleError = async ({INPUT, OUTPUT, input, page, setup}, error) => {
        if (Object.keys(OUTPUT).length)
            await saveOutput({INPUT, OUTPUT, input, page});

        // TODO rename & support other channels
        const {channel} = setup.SLACK;

        if (!INPUT.silent && setup.SLACK.channel) {
            await sendNotification({INPUT, OUTPUT, channel, error});
            console.error('---------------------------------------------------------');
            console.error('Error in robot - support notified to update configuration');
            console.error('---------------------------------------------------------');
        } else {
            console.error('---------------------------------------------------------------');
            console.error('Error in robot - please contact support to update configuration');
            console.error('---------------------------------------------------------------');
        }

        await this.stop();
        throw error;
    };

    sync = {
        task: task => {
            this._task = task;
            const taskCopy = task;
            this.context.task = taskCopy;

            if (this.scope)
                this.scope.task = taskCopy;
        },
        step: step => {
            const outputPrototype = {};

            Object.defineProperty(outputPrototype, 'attach', {
                value(output) {
                    if (!output || typeof output !== 'object') {
                        console.error('Ignoring output - not an object');
                        return;
                    }

                    Object.entries(output).map(entry => {
                        const [key, value] = entry;
                        this[key] = value;
                    });

                    return this;
                },
                enumerable: false,
            });

            const output = Object.create(outputPrototype);

            const stepCopy = {
                ...step,
                _output: output,
                get output() {
                    return this._output;
                },
                set output(output) {
                    try {
                        Object.entries(output).map(entry => {
                            const [key, value] = entry;
                            this._output[key] = value;
                        });
                    } catch (error) {
                        log.error(`Failed to set step output: ${output}`);
                    }
                },
                will(text) {
                    if (typeof text !== 'string') {
                        log.error('Custom steps only accept step name as an argument');
                        return;
                    }

                    // TODO fire custom event
                    // TODO fire websocket event
                    log.default('-'.repeat(100));
                    log.info(`NEXT [${text}]`);
                    log.default('-'.repeat(100));
                },
            };

            stepCopy.attachOutput = function (output) {
                this.output = output;
                return this.output;
            };

            this.context.step = stepCopy;

            if (this.scope)
                this.scope.step = stepCopy;
        },
    };

    stop = async () => {
        if (this.browserPool) {
            await this.browserPool.retireAllBrowsers();
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
