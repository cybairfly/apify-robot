/* eslint-disable lines-between-class-members */
/**
 * @typedef {import('apify').Session} Session
 * @typedef {import('apify').ProxyConfiguration} ProxyConfiguration
 *
 * @typedef {import('./types.d').Robot} Robot
 * @typedef {import('./types.d').RobotContext} RobotContext
 * @typedef {import('./types.d').input} input
 * @typedef {import('./types.d').options} options
 * @typedef {import('./setup/index')} setup
 */

const Apify = require('apify');
const Human = require('apify-human');
const R = require('ramda');
const path = require('path');

const log = require('./logger');
const Setup = require('./setup');
const Scope = require('./scope');
const Target = require('./target');

const ScopeConfig = Scope.Config;
const TargetConfig = Target.Config;

const { sleep } = Apify.utils;
const { SESSION } = require('./consts');
const { extendInput } = require('./tools/input');
const { RobotOptions } = require('./tools/options');
const { notifyChannel, shouldNotify } = require('./tools/notify');
const { transformTasks, resolveTaskTree } = require('./tools/tasks');
const { getTargetUrl, parseTargetDomain } = require('./tools/target');
const { decoratePage, initEventLogger, initTrafficFilter } = require('./tools/hooks');
const { getSessionId, persistSessionPoolMaybe } = require('./tools/session');
const { getLocation, getProxyConfig, getProxyIp } = require('./tools/proxy');
const { getBrowserPool, getStealthPage } = require('./tools/stealth');
const { maybeStartServer } = require('./tools/server');
const { syncContext } = require('./tools/context');
const { errors, RobotError } = require('./errors');
const { CaptchaSolver } = require('./tools/captcha');
const { createHeader } = require('./tools/generic');
const { openSessionPool, pingSessionPool } = require('./tools/session/sessionPool');
const { getBrowser, saveOutput, curryDebug, filterOutput, flushAsyncQueueCurry } = require('./tools');

const {preloadMatchPattern, preloadIteratePatterns} = require('./public/tools/patterns');
const consts = require('./public/consts');
const tools = require('./public/tools');

class Robot {
    /**
     * @param {input} input
     * @param {setup} setup
     */
    constructor(input, setup) {
        this.log = log;
        this.input = input;
        this.target = input.target;
        /** @type setup */
        this.setup = setup;
        this.isRetry = false;
        this.retryIndex = 0;
        this.retryCount = input.retry;
        // expose in target class somehow
        this.OUTPUTS = this.setup.OUTPUTS;

        this.relay = {};
        this.state = {};
        this.context = {};
        this._output = {};
        this._error = null;

        this.page = null;
        this.human = null;
        this.browser = null;
        this.browserPool = null;
        this.location = null;
        this.proxyIp = null;

        /** @type {ProxyConfiguration} */
        this.proxyConfig = null;

        /** @type {options} */
        this.options = null;

        /** @type {Session} */
        this.session = null;

        this.stealth = null;
        this.sessionId = null;
        this.sessionPool = null;
        this.rotateSession = false;
        this.domain = null;
        this.server = null;
        this.strategy = null;

        this.Scope = null;
        this.scope = {};
        this._step = null;
        this._task = null;
        this.tasks = {};
        this.steps = {};
        this.errors = [];
        this.asyncQueue = [];

        this.flushAsyncQueue = flushAsyncQueueCurry(this.asyncQueue);
        this.retry = this.catch(this.retry);
        this.syncContext = syncContext(this);
    }

    set task(task) {
        this._task = task;
    } get task() {
        return this._task;
    }

    set step(step) {
        this._step = step;
    } get step() {
        return this._step;
    }

    set error(error) {
        this._error = error;
        this.errors.unshift(error);
    } get error() {
        return this._error;
    }

    set output(output) {
        this.syncContext.output(output);
    } get output() {
        return this._output;
    }

    static Error = RobotError;
    static Human = Human;
    static Setup = Setup;
    static Scope = Scope;
    static Target = Target;
    static RobotError = RobotError;
    static ScopeConfig = ScopeConfig;
    static TargetConfig = TargetConfig;
    static CaptchaSolver = CaptchaSolver;

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

        if ((typeof tasks !== 'string' && !Array.isArray(tasks)) || !tasks.length)
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
            const doRetry = error.retry && input.retry > this.retryIndex;

            if (doRetry) {
                if (input.debug) {
                    const {output, input, page, retryCount} = this;
                    await saveOutput({input, output, page, retryCount});
                }

                this.isRetry = true;
                await this.stop();
                this.retryCount--;
                this.retryIndex++;

                log.exception(error);
                log.default(' '.repeat(100));
                log.default(`RETRY [R-${this.retryCount}]`);
                log.default('◄'.repeat(100));

                this.error = null;
                if (!this.session)
                    await this.assignSession();

                return this.retry(this);
            }

            await this.handleError(this);
        }
    };

    retry = async ({input: {target}, setup}) => {
        const url = getTargetUrl(setup, target);
        this.domain = parseTargetDomain(url, target);
        if (!this.isRetry && url) log.default({url});

        this.page = await this.initPage(this);
        maybeStartServer(this);
        decoratePage(this);
        initEventLogger(this);
        this.context = await this.createContext(this);
        this.output = await this.handleTasks(this);

        return this.output;
    };

    start = async ({input, setup} = this) => {
        this.input = await extendInput(this);
        this.options = RobotOptions(this);

        if (this.options.proxy.proximity.enable) {
            log.info('Acquiring proximity data...');
            const locationResult = await (setup.getProxyLocation || getLocation)(this);
            this.location = locationResult.output ? locationResult.output.value : locationResult;
            log.info('Location traced to', this.location);
        }

        await this.assignSession();

        if (!this.isRetry) {
            log.default(createHeader('INPUT', {padder: '▼'}));
            log.redact.object(input);
            log.default(createHeader('INPUT', {padder: '▲'}));

            log.default(createHeader('OPTIONS', {padder: '▼'}));
            log.redact.object(this.options);
            log.default(createHeader('OPTIONS', {padder: '▲'}));
        }

        this.tasks = await this.initTasks(this);
        this.proxyConfig = await getProxyConfig(this);
        this.output = (setup.OutputSchema && setup.OutputSchema({input})) || {};
        this.output = await this.retry(this);
        await saveOutput(this);

        const OUTPUT = filterOutput(this.output);
        log.default(' '.repeat(100));
        log.default('OUTPUT');
        log.default('='.repeat(100));
        log.default(OUTPUT);
        log.default(' ');

        await this.stop();
    }

    initScope = ({input: {target}, setup} = this) => target ?
        tryRequire.global(`./${setup.getPath.targets.target(target)}`, {scope: true}) :
        tryRequire.global(`./${setup.getPath.generic.scope()}`, {scope: true});

    initTasks = async ({input: {target, tasks: taskNames}, setup} = this) => {
        const setupTasks = setup.tasks ? setup.tasks : setup.getTasks(target);
        this.Scope = this.initScope();

        if (this.Scope.adaptTasks)
            this.Scope.tasks = setupTasks;

        const bootTasks = transformTasks(this.Scope.tasks || setupTasks);

        log.info('Resolving task dependency tree');
        const {taskList, taskTree} = resolveTaskTree(bootTasks, taskNames);
        log.info('Dependency tree resolved');

        if (!this.isRetry) {
            log.info('Task list from task tree:');
            log.default(createHeader('TASKS', {padder: '▼'}));
            taskList.flatMap(task => log.default(task));
            log.default(createHeader('TASKS', {padder: '▲'}));
        }

        log.default(taskTree);
        this.tasks = taskList;

        return this.tasks;
    }

    initPage = async ({input: {block, debug}, page = null, domain, options} = this) => {
        if (!page) {
            if (!this.options.browserPool.disable) {
                this.browserPool = await getBrowserPool(this);
                this.page = page = await this.browserPool.newPage();
            } else {
                this.browser = await getBrowser(this);

                if (options.library.puppeteer)
                    [page] = await this.browser.pages();
                else {
                    const [context] = this.browser.contexts();
                    [page] = context.pages();
                }

                this.page = page;
            }
        }

        if (block) {
            // TODO full support for traffic filters in Puppeteer (interception mode)
            if (options.library.puppeteer) {
                log.warning('Traffic filters supported in limited mode for Puppeteer');
                await Apify.utils.puppeteer.blockRequests(page, {urlPatterns: [
                    ...options.trafficFilter.urlPatterns,
                ]});
            } else
                initTrafficFilter(page, domain, options);
        }

        if (debug) {
            this.proxyIp = await getProxyIp(page);
            log.console.debug({proxyIp: this.proxyIp});
        }

        return page;
    };

    createContext = async ({input, output, page, relay, state, server, browserPool, sessionPool} = this) => {
        this.context = (robot => ({
            // TODO remove legacy support
            INPUT: Object.freeze(input),
            OUTPUT: output,
            relay,

            input: {...input},
            output,
            page,
            pools: {
                browserPool,
                sessionPool,
            },
            events: {
                emit: 'placeholder',
                listen: 'placeholder',
            },
            tools: {
                debug: curryDebug(input)(page),
                matchPattern: preloadMatchPattern(page),
                iteratePatterns: preloadIteratePatterns(page),
            },
            server,
            state,
            step: null,
            task: null,

            get human() {
                robot.human = robot.human || new Human(this.page, {...this.input, human: {motion: {enable: false}}});
                return robot.human;
            },
        }))(this);

        return this.context;
    }

    handleTasks = async ({input: {target}, output, context, page, setup, tasks} = this) => {
        log.default(createHeader(target, {center: true, upper: true, padder: '◙'}));

        for (const task of tasks) {
            this.task = {...task};
            this.task.model = Object.freeze(task);
            this.syncContext.task(this.task);

            log.default(' '.repeat(100));
            log.default(`TASK [${task.name}]`);
            log.default('■'.repeat(100));

            this.task.init = !task.init || task.init(context);
            this.task.skip = task.skip && task.skip(context);

            if (!this.task.init) {
                log.join.info(`TASK [${task.name}] skipped on test ${task.init}`);
                continue;
            }

            if (this.task.skip) {
                log.join.info(`TASK [${task.name}] skipped on test ${task.skip}`);
                continue;
            }

            await page.waitForFunction(() => document.readyState === 'complete').catch(error => null);

            for (const step of task.steps) {
                this.step = {...step};
                this.step.model = Object.freeze(step);
                this.syncContext.step(this.step);

                log.default(' '.repeat(100));
                log.default(`TASK [${task.name}] ► STEP [${step.name}]`);
                log.default('▬'.repeat(100));

                this.step.init = !step.init || step.init(context);
                this.step.skip = step.skip && step.skip(context);

                if (this.step.abort && this.step.abort(context)) {
                    log.join.warning(`Aborting on step [${step.name}] on test ${step.abort}`);
                    break;
                }

                if (!this.step.init) {
                    log.join.info(`STEP [${step.name}] of task [${task.name}] skipped on test ${step.init}`);
                    continue;
                }

                if (this.step.skip) {
                    log.join.info(`STEP [${step.name}] of task [${task.name}] skipped on test ${step.skip}`);
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

                if (this.step.code) {
                    this.step.output = await this.step.code(context, this)
                        .catch(error => {
                            const scopeError = this.probeError(error);
                            throw scopeError;
                        });
                } else {
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
                    this.step.output = await this.step.code(context, this)
                        .catch(async error => {
                            this.error = error;
                            const scopeError = this.probeError(error);

                            if (!task.catch || error instanceof Robot.Error)
                                throw scopeError;

                            this.task.catch = this.scope[task.catch.name] && this.scope[task.catch.name].constructor.name !== 'AsyncFunction' ?
                                this.scope[task.name] && this.scope[task.name](this.context, this)[task.catch.name] :
                                this.scope[task.catch.name];

                            if (this.task.catch)
                                log.join.info(`SCOPE Scope error handler found for task [${task.name}]`);
                            else {
                                this.task.catch = global.tryRequire.global(path.join(setup.getPath.generic.steps(), task.catch.name));

                                if (this.task.catch)
                                    log.join.info(`STEP Generic error handler found for task [${task.name}]`);
                            }

                            if (!this.task.catch)
                                throw scopeError;

                            const result = await this.task.catch(context, this).catch(error => {
                                log.exception(scopeError);
                                throw error;
                            });

                            if (result)
                                return result;

                            throw scopeError;
                        });
                }

                log.default(' '.repeat(100));
                log.default(`TASK [${task.name}] ► STEP [${step.name}] ➜ OUTPUT`);
                log.default('='.repeat(100));
                log.default(this.step.output);
                log.default(' ');

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

            if (this.step.abort && this.step.abort(context)) {
                log.join.warning(`Aborting on task [${task.name}] on test ${this.step.abort}`);
                break;
            }

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

    assignSession = async ({input: {session, proxyConfig}, options} = this) => {
        this.sessionId = getSessionId(this);
        // TODO update for standalone usage
        if (!options.sessionPool.disable) {
            // ArgumentError: Did not expect property `disable` to exist, got `false` in object `options`
            this.originalSessionPoolOptions = {...this.options.sessionPool};
            delete this.originalSessionPoolOptions.disable;

            this.sessionPool = await openSessionPool(this.originalSessionPoolOptions);
            this.session = await this.sessionPool.getSession(session && this.sessionId);
            this.session.retireOnBlockedStatusCodes(SESSION.retireStatusCodes);
            log.console.debug('Retire session on status codes:', SESSION.retireStatusCodes);
            log.console.info('Usable proxy sessions:', this.sessionPool.usableSessionsCount);
            log.console.info('Retired proxy sessions:', this.sessionPool.retiredSessionsCount);
        } else {
            this.session = {
                id: this.sessionId,
                userData: {},
            };
        }

        log.console.info({
            sessionId: this.sessionId,
            'session.id': this.session.id,
        });
    }

    probeError = error => {
        const isNetworkError = ['net::', 'NS_BINDING_ABORTED', 'NS_ERROR_NET_'].some(item => error.message && error.message.includes(item));
        if (isNetworkError)
            error = new errors.Network({error});

        if (error instanceof Robot.Error === false)
            error = new Robot.Error({error, stack: error.stack});

        return error;
    }

    handleError = async ({input, output, error, page, sessionPool} = this) => {
        this.asyncQueue.push(this.stop());

        if (Object.keys(output).length)
            await saveOutput({input, output, page});

        if (log.getLevel() === log.LEVELS.DEBUG)
            log.object.debug(error);

        await this.reportError(this);

        if (sessionPool)
            await pingSessionPool(this);

        await this.flushAsyncQueue();

        throw error;
    };

    reportError = async ({input, output, options, error, setup} = this) => {
        if (shouldNotify({input, error, setup, options})) {
            await notifyChannel({input, output, error, options});
            console.error('■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■');
            console.error('Error in robot - support notified to update configuration');
            console.error('■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■');
        } else {
            console.error('■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■');
            console.error('Error in robot - please contact support to update configuration');
            console.error('■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■');
        }
    };

    stop = async ({browserPool, sessionPool, browser, options, session, human, server, page, error, input} = this) => {
        this.syncContext.page(null);

        if (human)
            this.human = null;

        if (browser) {
            log.debug('Closing the browser');
            await browser.close().catch(error => {
                log.debug('Failed to close browser');
            });
        }

        if (browserPool) {
            log.debug('Destroying browser pool');
            await browserPool.retireAllBrowsers();
            // await stuck if no browser launched
            browserPool.destroy();
        }

        if (sessionPool) {
            if (!error)
                session.markGood();

            if (error) {
                if (error.retireSession || error instanceof errors.Network || error instanceof errors.session.Retire) {
                    log.debug('Retiring session');
                    session.retire();
                    this.rotateSession = true;
                    session.userData.fingerprint = null;
                } else if (error.retainSession || error instanceof errors.session.Retain) {
                    log.debug('Marking session good');
                    session.markGood();
                } else {
                    log.debug('Marking session bad');
                    session.markBad();

                    log.debug('Removing fingerprint');
                    session.userData.fingerprint = null;
                }
            }

            this.sessionPool = await openSessionPool(this.originalSessionPoolOptions);
            await persistSessionPoolMaybe(this);
        }

        // TODO merge w/ session pool logic
        // if (error && !sessionPool) { duplicity needed after persisting pool
        if (error) {
            if (error.retireSession || error instanceof errors.session.Retire) {
                log.debug('Retiring session');
                this.rotateSession = true;
                this.sessionId = null;
                this.session = null;
            } else if (error.rotateSession || error instanceof errors.session.Rotate) {
                log.debug('Rotating session');
                this.rotateSession = true;
                this.sessionId = null;
                this.session = null;
            } else {
                log.debug('Removing fingerprint');
                session.userData.fingerprint = null;
            }
        }

        if (server) {
            await sleep(options.server.interface.snapshotTimeoutSecs);
            await server.serve(page);
            await sleep(5 * 1000);
        }
    };
}

module.exports = Robot;
