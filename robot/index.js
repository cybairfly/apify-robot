const Apify = require('apify');
const R = require('ramda');
const path = require('path');

const {sleep} = Apify.utils;

const log = require('./logger');
const Setup = require('./setup');
const Scope = require('./scope');
const Target = require('./target');

const ScopeConfig = Scope.Config;
const TargetConfig = Target.Config;

const { SESSION } = require('./consts');
const { RobotOptions } = require('./tools/options');
const { notifyChannel } = require('./tools/notify');
const { transformTasks, resolveTaskTree } = require('./tools/tasks');
const { decoratePage, initEventLogger, initTrafficFilter } = require('./tools/hooks');
const { getProxyConfig } = require('./tools/proxy');
const { getBrowserPool } = require('./pools');
const { startServer } = require('./tools/server');
const { syncContext } = require('./tools/context');
const { parseDomain, saveOutput } = require('./tools');
const { errors, RobotError } = require('./errors');

const consts = require('./public/consts');
const tools = require('./public/tools');

class Robot {
    constructor(input, setup) {
        this.log = log;
        this.input = input;
        this.target = input.target;
        this.setup = setup;
        this.isRetry = false;
        this.retryIndex = 0;
        this.retryCount = input.retry;
        // expose in target class somehow
        this.OUTPUTS = this.setup.OUTPUTS;

        this.relay = {};
        this.context = {};
        this._error = {};
        this._output = {};
        // this.output = {};

        this.page = null;
        this.browser = null;
        this.browserPool = null;
        this.options = null;
        this.stealth = null;
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
        this.errors = [];

        this.retry = this.catch(this.retry);
        this.syncContext = syncContext(this);
    }

    get task() {
        return this._task;
    }

    get step() {
        return this._step;
    }

    get error() {
        return this._error;
    }

    get output() {
        return this._output;
    }

    set task(task) {
        this._task = task;
    }

    set step(step) {
        this._step = step;
    }

    set error(error) {
        this._error = error;
        this.errors.unshift(error);
    }

    set output(output) {
        this.syncContext.output(output);
    }

    static Error = RobotError;

    static Setup = Setup;

    static Scope = Scope;

    static Target = Target;

    static RobotError = RobotError;

    static ScopeConfig = ScopeConfig;

    static TargetConfig = TargetConfig;

    static consts = consts;

    static errors = errors;

    static tools = tools;

    static transformTasks = transformTasks;

    static route = rootPath => {
        this.route = rootPath;

        return this;
    }

    static check = input => {
        if (!input)
            throw Error('input not found. Check input before building robot: Robot.check(input).build(setup).start()');

        // TODO json validation
        const {tasks, target} = input;

        if (typeof input !== 'object' || input === null)
            throw Error('Task input missing in actor input: input<object>');

        if (typeof tasks !== 'string' && !Array.isArray(tasks) || !tasks.length)
            throw Error('Task missing in actor input: tasks<array>');

        this.input = input;

        return this;
    };

    static build = setup => {
        if (!this.route)
            throw Error('Route not found. Provide project root path before building robot: Robot.route(route).check(input).build(setup).start()');

        if (!this.input)
            throw Error('input not found. Check input before building robot: Robot.route(route).check(input).build(setup).start()');

        this.setup = setup;
        this.setup.rootPath = this.route;
        const {debug, target} = this.input;

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

        return new Robot(this.input, this.setup);
    };

    catch = retry => async ({input} = this) => {
        try {
            return await retry(this);
        } catch (error) {
            this.error = error;

            if (input.retry > this.retryIndex) {
                if (input.debug) {
                    const {output, input, page, retryCount} = this;
                    await saveOutput({input, output, page, retryCount});
                }

                this.isRetry = true;
                this.retryCount--;
                this.retryIndex++;
                await this.stop();

                log.error(error.message);
                log.error(error.stack);

                log.default('◄'.repeat(100));
                log.info(`RETRY [R-${this.retryCount}]`);
                log.default('◄'.repeat(100));

                return this.retry(this);
            }

            this.probeError(this);
            await this.handleError(this);
        }
    };

    retry = async () => {
        this.tasks = await this.initTasks(this);
        this.page = await this.initPage(this);
        this.context = await this.createContext(this);
        this.output = await this.handleTasks(this);

        return this.output;
    };

    start = async ({input, input: {tasks: taskNames, target, session, stealth}, setup} = this) => {
        input.id = await setup.getInputId(input);
        this.context = await this.createContext(this);
        this.options = RobotOptions({input, setup});

        if (target)
            this.Scope = tryRequire.global(`./${setup.getPath.targets.target(target)}`) || this.Scope;
        else
            this.Scope = tryRequire.global(`./${setup.getPath.generic.scope()}`) || this.Scope;

        if (session) {
            this.sessionId = Apify.isAtHome() ?
                setup.getProxySessionId.apify(this.context) :
                setup.getProxySessionId.local(this.context);
        }

        if (!this.options.browserPool.disable) {
            this.sessionPool = await Apify.openSessionPool(this.options.sessionPool);
            this.session = await this.sessionPool.getSession(session && this.sessionId);
            this.session.retireOnBlockedStatusCodes(SESSION.retireStatusCodes);
            log.debug('sessionPool state', this.sessionPool.getState());
            log.debug('sessionPool count - usable', this.sessionPool.usableSessionsCount);
            log.debug('sessionPool count - retired', this.sessionPool.retiredSessionsCount);
        }

        if (!this.isRetry) {
            log.redact.object(input);
            log.redact.object(this.options);
        }

        this.proxyConfig = await getProxyConfig({input, sessionId: this.sessionId});
        this.output = (setup.OutputSchema && setup.OutputSchema({input})) || {};
        this.output = await this.retry(this);

        await saveOutput(this);
        log.default({OUTPUT: this.output});
        await this.stop();
    }

    initTasks = async ({input: {target, tasks: taskNames}, setup} = this) => {
        const setupTasks = setup.tasks ? setup.tasks : setup.getTasks(target);

        if (this.Scope.adaptTasks)
            this.Scope.tasks = setupTasks;

        const bootTasks = transformTasks(this.Scope.tasks || setupTasks);
        this.tasks = resolveTaskTree(bootTasks, taskNames);

        if (!this.isRetry) {
            log.info('Task list from task tree:');
            this.tasks.flatMap(task => log.default(task));
        }

        return this.tasks;
    };

    initPage = async ({input: {block, debug, target, stream, stealth}, page = null, session, setup, options} = this) => {
        const source = tryRequire.global(setup.getPath.targets.config(target)) || tryRequire.global(setup.getPath.targets.setup(target)) || {};
        const url = source.TARGET && source.TARGET.url;
        const domain = parseDomain(url, target);

        if (!this.isRetry && url) log.default({url});

        if (!page) {
            if (!this.options.browserPool.disable) {
                this.browserPool = await getBrowserPool(this.options.browserPool, this.proxyConfig, this.session, this.stealth);
                this.page = page = await this.browserPool.newPage();

                if (block)
                    initTrafficFilter(page, domain, options);
            } else {
                const proxyUrl = this.proxyConfig.newUrl(this.sessionId);
                const options = {...this.options.launchPuppeteer, proxyUrl};
                this.browser = await Apify.launchPuppeteer(options);
                [page] = await this.browser.pages();
                this.page = page;
            }
        }

        if (block && this.options.browserPool.disable)
            await Apify.utils.puppeteer.blockRequests(page, this.options.trafficFilter);

        // const singleThread = setup.maxConcurrency === 1;
        const shouldStartServer = !this.server && stream;
        const server = this.server = this.server || (shouldStartServer && startServer(page, setup, this.options.liveViewServer));

        decoratePage(page, server, session);
        initEventLogger(page, domain, {debug});

        return page;
    };

    createContext = async ({input, output, page, relay, server} = this) => {
        this.context = {
            // TODO remove legacy support
            INPUT: Object.freeze(input),
            OUTPUT: output,

            input: Object.freeze(input),
            output,
            page,
            pools: {
                browserPool: 'placeholder',
                sessionPool: 'placeholder',
            },
            events: {
                emit: 'placeholder',
                listen: 'placeholder',
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
            server,
            relay,
            step: null,
            task: null,
        };

        return this.context;
    }

    handleTasks = async ({input, output, context, page, relay, setup, tasks} = this) => {
        const {target} = input;

        log.default('●'.repeat(100));
        console.log(`Target: ${target}`);
        log.default('●'.repeat(100));

        for (const task of tasks) {
            this.task = {...task};
            this.syncContext.task(task);

            log.default('■'.repeat(100));
            log.info(`TASK [${task.name}]`);
            log.default('■'.repeat(100));

            this.task.init = !task.init || task.init(context);
            this.task.skip = task.skip && task.skip(context);

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
                this.syncContext.step(step);

                log.default('▬'.repeat(100));
                log.info(`STEP [${step.name}] @ TASK [${task.name}]`);
                log.default('▬'.repeat(100));

                this.step.init = !step.init || step.init(context);
                this.step.skip = step.skip && step.skip(context);

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
                    log.join.info(`STEP Generic handler found for step [${step.name}] of task [${task.name}]`);
                else {
                    log.join.debug(`STEP Generic handler not found for step [${step.name}] of task [${task.name}]`);

                    this.step.code = tryRequire.global(path.join(setup.getPath.targets.steps(target), step.name));
                    if (this.step.code)
                        log.join.info(`STEP Target handler found for step [${step.name}] of task [${task.name}] in ${target ? 'target' : 'scope'} [${target}]`);
                    else
                        log.join.debug(`STEP Target handler not found for step [${step.name}] of task [${task.name}] in ${target ? 'target' : 'scope'} [${target}]`);
                }

                if (this.step.code)
                    this.step.output = await this.step.code(this.context, this);

                else {
                    this.step.code = this.scope[task.name] && this.scope[task.name].constructor.name !== 'AsyncFunction' ?
                        this.scope[task.name](this.context, this)[step.name] :
                        this.scope[step.name];

                    if (!this.step.code) {
                        try {
                            this.scope = this.Scope ? new this.Scope(this.context, this) : new Robot.Scope(this.context, this);
                        } catch (error) {
                            log.warning('DEPRECATED: Running target in backward compatibility mode - please update target to match the new API');
                            this.scope = this.Scope ? new this.Scope(this.context, target, this) : new Robot.Scope(this.context, target, this);
                        }

                        this.scope.robot = this;
                        this.syncContext.step(step);

                        // TODO legacy support - reverse logic
                        this.step.code = this.scope[step.name] ?
                            this.scope[step.name] :
                            this.scope[task.name] && this.scope[task.name](this.context, this)[step.name];

                        if (!this.step.code) {
                            const message = target ?
                                `TARGET: Scope handler not found for step [${step.name}] of task [${task.name}] as scope [${target}]` :
                                `SCOPE: Scope handler not found for step [${step.name}] of task [${task.name}]`;

                            log.join.debug(message);
                            await this.stop();
                            throw Error(message);
                        }
                    }

                    // TODO support task scope modules to enable scope per task usage
                    // const line = target ?
                    //     `${target ? 'TARGET' : 'SCOPE'} Target scope found for step [${step.name}] of task [${task.name}] as scope [${task.name}] for target [${target}]` :
                    //     `${target ? 'TARGET' : 'SCOPE'} Generic scope found for step [${step.name}] of task [${task.name}] as scope [${task.name}]`;
                    // log.join.debug(line);

                    const message = target ?
                        `STEP Target handler found for step [${step.name}] of task [${task.name}] in scope [${target}]` :
                        `STEP Generic handler found for step [${step.name}] of task [${task.name}]`;

                    log.join.info(message);
                    this.step.output = await this.step.code(this.context, this);
                }

                if (this.step.output && typeof this.step.output !== 'object') {
                    log.join.warning('STEP ignoring step output (not an object)', output);
                    this.step.output = {};
                }

                if (this.scope.step.output && typeof this.scope.step.output !== 'object') {
                    log.join.warning('STEP ignoring step output (not an object)', output);
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

                this.step.done = !step.done || step.done(context);
                this.step.stop = step.stop && step.stop(context);

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

            this.task.done = !task.done || task.done(context);
            this.task.stop = task.stop && task.stop(context);

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

        return output;
    };

    probeError = ({error} = this) => {
        const isNetworkError = ['net::', 'NS_BINDING_ABORTED'].some(item => error.message.startsWith(item));
        if (isNetworkError)
            this.error = new errors.Network({error});

        return this.error;
    }

    handleError = async ({input, output, options, error, page, setup} = this) => {
        if (Object.keys(output).length)
            await saveOutput({input, output, page});

        await this.stop();

        if (!input.silent) {
            await notifyChannel({input, output, error, setup});
            console.error('---------------------------------------------------------');
            console.error('Error in robot - support notified to update configuration');
            console.error('---------------------------------------------------------');
        } else {
            console.error('---------------------------------------------------------------');
            console.error('Error in robot - please contact support to update configuration');
            console.error('---------------------------------------------------------------');
        }

        throw error;
    };

    stop = async ({browserPool, sessionPool, browser, options, session, server, page, errors: [error]} = this) => {
        this.syncContext.page(null);

        if (browser) {
            await browser.close().catch(error => {
                log.debug('Failed to close browser');
            });
        }

        if (browserPool) {
            await browserPool.retireAllBrowsers();
            await browserPool.destroy();
        }

        if (sessionPool) {
            if (!error)
                session.markGood();

            if (error) {
                if (error instanceof errors.Network || error instanceof errors.RetireSession)
                    session.retire();

                else if (error.retainSession || error instanceof errors.RetainSession)
                    session.markGood();

                else
                    session.markBad();
            }

            sessionPool.persistState();
        }

        if (server) {
            await sleep(options.liveViewServer.snapshotTimeoutSecs || 3 * 1000);
            await server.serve(page);
            await sleep(5 * 1000);
        }
    };
}

module.exports = Robot;
