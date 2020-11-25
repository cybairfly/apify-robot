const Apify = require('apify');
const path = require('path');
// const {log: defaultLog} = Apify.utils;

const log = require('./log');

const {
    PUPPETEER,
} = require('../consts');

const {
    prepareDecrypt,
} = require('../crypto/crypto');

const {
    postError,
} = require('../slack/slack');

const {
    CustomError,
} = require('../errors');

const {Server} = require('../server/server');

// #####################################################################################################################

const tryRequire = {
    local: log => localPath => {
        try {
            log.debug(localPath);
            return require(localPath);
        } catch (error) {
            const [message, ...stack] = error.message.split('\n');
            log.debug(message);
            log.debug(stack);
            return false;
        }
    },
    global: (log, rootPath) => globalPath => {
        try {
            const requirePath = path.join(rootPath, globalPath);
            log.join.debug('ROOT:', rootPath);
            log.join.debug('PATH:', requirePath);
            return require(requirePath);
        } catch (error) {
            log.debug(error.message);
            log.debug(error.stack);
            return false;
        }
    },
};

const decrypt = async (input, logSecret = false) => {
    const keyStore = await Apify.openKeyValueStore('keyStore');
    const decrypt = await prepareDecrypt(keyStore);
    log.info(`Encrypted input: [${input}]`);

    try {
        const decrypted = decrypt(input);

        const logOutput = logSecret ?
            `Input decrypted: [${decrypted}]` :
            `Input decrypted: [${input}]`;

        log.info(logOutput);

        return decrypted;
    } catch (error) {
        const logOutput = logSecret ?
            `Failed to decrypt: [${decrypted}]` :
            `Failed to decrypt: [${input}]`;

        log.warning(logOutput);

        return input;
    }
};

const decryptObject = async object => {
    const keyStore = await Apify.openKeyValueStore('keyStore');
    const decrypt = await prepareDecrypt(keyStore);
    log.info('Encrypted input:');
    console.log(object);

    for (const key in object) {
        try {
            object[key] = decrypt(object[key]);
            log.info(`Input decrypted: [${key}]`);
        } catch (error) {
            log.warning(`Failed to decrypt [${key}]`);
        }
    }
};

const transformTasks = tasks =>
    Object
        .entries(tasks)
        .reduce((pool, [taskName, task]) =>
            pool = [...pool, {name: taskName, ...task}], []);

const resolveTaskTree = (bootTasks, taskNames) => {
    log.info('Resolving task dependency tree');

    taskNames = Array.isArray(taskNames) ? taskNames : [taskNames];

    const filterTasksByName = taskNames => taskNames.map(taskName => bootTasks.find(task => task.name === taskName));

    const getTreeByTaskName = (baseTasks, level = 0) =>
        baseTasks.reduce((pool, baseTask) => {
            if (level > 99)
                throw Error('Circular dependency detected');

            const mergeTasks = baseTask.merge && baseTask
                .merge
                .map(mergeTaskName =>
                    bootTasks.find(task =>
                        task.name === mergeTaskName));

            return pool = mergeTasks
                ? [
                    ...pool,
                    {
                        [baseTask.name]: [
                            baseTask,
                            ...getTreeByTaskName(mergeTasks, ++level),
                        ],
                    }]
                : [
                    ...pool,
                    {
                        [baseTask.name]: [
                            baseTask,
                        ],
                    },
                ];
        }, []);

    const treeByTask = getTreeByTaskName(filterTasksByName(taskNames));

    const getTaskList = treeByTask => treeByTask.flatMap(treePerTask => {
        const getFlatDepsPerTask = treePerTask => {
            return Object.keys(treePerTask).flatMap(taskName => {
                return treePerTask[taskName].flatMap(task => {
                    return task.name ? task : getFlatDepsPerTask(task);
                });
            });
        };

        const taskList = getFlatDepsPerTask(treePerTask);

        return taskList.reverse();
    });

    const taskList = getTaskList(treeByTask);
    const taskListNames = taskList.map(task => task.name);

    const getTreeJson = treeByTask =>
        JSON.stringify(treeByTask.map(taskTree =>
            Object.keys(taskTree).map(taskName =>
                taskTree[taskName])), [...taskListNames, 'name', 'merge'], '**');

    console.log(getTreeJson(treeByTask));
    log.info('Dependency tree resolved');

    return taskList;
};

const getProxyConfiguration = async ({INPUT: { proxyConfig = {} }, sessionId}) => {
    const [inputProxyUrl] = proxyConfig && proxyConfig.proxyUrls || [];
    // FIXME
    const proxyUrl = inputProxyUrl && inputProxyUrl.includes('proxy.apify.com')
        ? inputProxyUrl
            .split('//')
            .map((chunk, index) => index ? `session-${sessionId},${chunk}` : chunk)
            .join('//')
        : inputProxyUrl;

    const proxyConfiguration = await Apify.createProxyConfiguration({
        proxyUrls: proxyUrl && [proxyUrl] || proxyConfig.proxyUrls,
        groups: proxyConfig.groups || proxyConfig.apifyProxyGroups,
        countryCode: proxyConfig.countryCode || proxyConfig.country,
    });

    return proxyConfiguration;
};

const getPage = async options => {
    const browser = await Apify.launchPuppeteer(options.launchPuppeteer);
    const [page] = await browser.pages();
    return page;
};

const getUserAgent = () => {
    const userAgent = Apify.utils.getRandomUserAgent();
    const match = userAgent.includes('AppleWebKit')
        && userAgent.includes('(Windows')
        && userAgent.match('Chrome/[.0-9]* Safari')
        && !userAgent.includes('Edge/')
        && !userAgent.includes('OPR/');

    return match ? userAgent : getUserAgent();
};

const getOptions = {
    blockRequests: (target, CUSTOM_OPTIONS, DEFAULT_OPTIONS) => ({
        urlPatterns: Object
            .keys(DEFAULT_OPTIONS.blockRequests)
            .reduce((pool, next) => {
                return pool = [
                    ...pool,
                    ...(CUSTOM_OPTIONS && CUSTOM_OPTIONS.blockRequests ?
                        CUSTOM_OPTIONS.blockRequests[next] || DEFAULT_OPTIONS.blockRequests[next] :
                        DEFAULT_OPTIONS.blockRequests[next]),
                ];
            }, []),
    }),
};

const redactOptions = options => ({
    ...options,
    launchPuppeteer: {
        ...options.launchPuppeteer,
        ...(options.launchPuppeteer.proxyUrl ? {proxyUrl: '<redacted>'} : {}),
    },
});

const deepTransform = (object, transformer, ...args) => {
    Object.keys(object).forEach(key => {
        transformer(object, key, ...args);

        if (typeof object[key] === 'object')
            return deepTransform(object[key], transformer, ...args);
    });

    return object;
};

const redactObject = (object, redactKeys = ['proxyUrl', 'proxyUrls']) => {
    const transformer = (object, key, redactKeys) => {
        if (redactKeys.some(redactKey => key === redactKey))
            object[key] = '<redacted>';
    };

    return deepTransform(object, transformer, redactKeys);
};

const urlLogger = async page => {
    const lastUrl = await page.evaluate(() => window.location.href).catch(() => null);
    lastUrl && console.log({lastUrl});
};

const responseErrorLogger = async (domain, response) => {
    const url = response.url();
    const status = response.status();
    // console.log(status, domain, url);
    if (!url.startsWith('data:') && url.includes(domain)) {
        if (status >= 400 && status !== 404) {
            const headers = response.headers();
            const text = await response.text().catch(() => null);
            const requestUrl = await response.request().url();
            const requestHeaders = await response.request().headers();
            const requestPostData = await response.request().postData();
            console.log(status, url, {
                headers,
                text,
                requestUrl,
                requestHeaders,
                // requestPostData
            });
        }
    }
};

const initEventLoggers = (page, target, string) => {
    try {
        const parsedUrl = new URL(string);
        string = parsedUrl.hostname;
    } catch (error) {
        string = target;
    }

    // TODO
    const [fallback, domain] = string.split('.').reverse();
    const urlLoggerBound = urlLogger.bind(null, page);
    const responseErrorLoggerBound = responseErrorLogger.bind(null, domain || fallback);
    page.on(PUPPETEER.events.domcontentloaded, urlLoggerBound);
    page.on(PUPPETEER.events.response, responseErrorLoggerBound);
};

const extendLog = (log, id) => {
    log.default = (...args) => console.log(...args);
    log.redact = {
        object: (...args) => {
            args = args.map(arg =>
                typeof arg === 'object' ?
                    redactObject(JSON.parse(JSON.stringify(arg))) :
                    arg);

            log.default(args);
        },
    };

    log.id = {
        info: (id => message => log.info(`${id} ${message}`))(id),
        debug: (id => message => log.debug(`${id} ${message}`))(id),
        error: (id => message => log.error(`${id} ${message}`))(id),
        warn: (id => message => log.warning(`${id} ${message}`))(id),
    };

    log.join = {
        info: (...args) => log.info(`${args.join(' ')}`),
        debug: (...args) => log.debug(`${args.join(' ')}`),
        error: (...args) => log.error(`${args.join(' ')}`),
        warn: (...args) => log.warning(`${args.join(' ')}`),
    };

    log.object = {
        info: object => log.info(`${JSON.stringify(object, null, 2)}`),
        debug: object => log.debug(`${JSON.stringify(object, null, 2)}`),
        error: object => log.error(`${JSON.stringify(object, null, 2)}`),
        warn: object => log.warning(`${JSON.stringify(object, null, 2)}`),
    };

    return log;
};

const decorate = (instance, methods, decorator) => {
    methods.map(methodName => {
        const originalMethod = instance[methodName];

        if (originalMethod.constructor.name === 'Function') {
            instance[methodName] = (...originalArgs) => {
                const contextArgs = {methodName};
                originalArgs = decorator(contextArgs)(originalArgs) || originalArgs;
                return originalMethod.apply(instance, originalArgs);
            };
        } else if (originalMethod.constructor.name === 'AsyncFunction') {
            instance[methodName] = async (...originalArgs) => {
                const contextArgs = {methodName};
                originalArgs = await decorator(contextArgs)(originalArgs) || originalArgs;
                return await originalMethod.apply(instance, originalArgs);
            };
        }
    });

    return instance;
};

const decoratePage = (page, server) => {
    const decorateGoto = async (page, args, originalMethod) => {
        const response = await originalMethod.apply(page, args);
        const status = response.status();

        if (status >= 400) {
            throw CustomError({
                name: 'Status',
                data: {
                    status,
                },
                message: `Page failed to load with status ${status}`,
            });
        }

        return response;
    };

    PUPPETEER.page.methodsNames.logging.map(methodName => {
        const originalMethod = page[methodName];

        if (PUPPETEER.page.methodsNames.liveView.some(methodNameLiveView => methodName.includes(methodNameLiveView))) {
            page[methodName] = async (...args) => {
                const argsForLog = args => args.map(arg => typeof arg === 'function' ? arg.toString().replace(/\s+/g, ' ') : arg);
                console.log({[methodName]: argsForLog(args)});

                try {
                    const result = await originalMethod.apply(page, args);

                    if (server)
                        await server.serve(page);

                    return result;
                } catch (error) {
                    if (server)
                        await server.serve(page);

                    throw error;
                }
            };
        } else {
            page[methodName] = async (...args) => {
                // log.info(`${methodName}${Array.isArray(args) ? '(' + args.map(arg => JSON.stringify(arg)).join(', ') + ')' : ''}`);
                // const argsString = args.length && `(${args.map(arg => JSON.stringify(arg)).join(', ')})`;
                // const argsForLog = args => args.map(arg => typeof arg === 'function' ? arg.toString().replace(/\s+/g, ' ') : arg);
                // const argsForLog = args => args.map(arg => {
                //     switch (typeof arg) {
                //         case 'object': return Array.isArray(arg) ? arg.toString() : JSON.stringify(arg);
                //         case 'string': return arg;
                //         case 'function': return arg.toString();
                //     }
                // }).join(', ');
                // console.log({[methodName]: args});

                // SANITIZE SENSITIVE DATA
                const argsForLog = args =>
                    methodName === 'type' ?
                        args.slice(0, 1) :
                        args.map(arg => typeof arg === 'function' ?
                            arg
                                .toString()
                                .replace(/\s+/g, ' ') :
                            arg);

                console.log({[methodName]: argsForLog(args)});

                if (methodName === 'goto')
                    return await decorateGoto(page, args, originalMethod);

                return await originalMethod.apply(page, args);
            };
        }
    });

    return page;
};

const startServer = (page, setup, options) => {
    const server = new Server(page, setup, options);
    // page.on(PUPPETEER.events.domcontentloaded, async () => await server.serve(page));
    page.on(PUPPETEER.events.load, async () => await server.serve(page));

    server.start();
    return server;
};

const saveScreenshot = async ({page, store, id, name}) => {
    // Cannot take screenshot with 0 width.
    try {
        await page.waitForFunction(() => document.readyState !== 'loading').catch(() => null);
        const screenshotBuffer = await page.screenshot({type: 'jpeg', quality: 70, fullPage: true});
        const fileName = `PAGE-SNAP-${name || 'FINAL'}-${id || Date.now()}`;

        if (store)
            await store.setValue(fileName, screenshotBuffer, {contentType: 'image/png'});

        else
            await Apify.setValue(fileName, screenshotBuffer, {contentType: 'image/png'});

        const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
        return `https://api.apify.com/v2/key-value-stores/${storeId}/records/${fileName}`;
    } catch (error) {
        log.debug(error);
        log.warning('Failed to take a screenshot');
    }
};

const savePageContent = async ({page, store, id, name}) => {
    try {
        const fileName = `PAGE-HTML-${name || 'FINAL'}-${id || Date.now()}`;

        if (store)
            await store.setValue(fileName, await page.content(), {contentType: 'text/html'});

        else
            await Apify.setValue(fileName, await page.content(), {contentType: 'text/html'});

        const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
        return `https://api.apify.com/v2/key-value-stores/${storeId}/records/${fileName}`;
    } catch (error) {
        log.debug(error);
        log.warning('Failed to capture page content');
    }
};

const saveOutput = async ({page, name, input, store, OUTPUT}) => {
    const {id} = input;
    const pageContentUrl = await savePageContent({page, store, id, name}) || null;
    const screenshotUrl = await saveScreenshot({page, store, id, name}) || null;
    const actorRunUrl = `https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}`;

    OUTPUT = {...OUTPUT, actorRunUrl, screenshotUrl, pageContentUrl};

    if (store)
        await store.setValue('OUTPUT', JSON.stringify(OUTPUT), {contentType: 'application/json'});

    else
        await Apify.setValue('OUTPUT', JSON.stringify(OUTPUT), {contentType: 'application/json'});

    return OUTPUT;
};

const sendNotification = async ({INPUT, channel, error}) => {
    const {debug, target} = INPUT;

    const notStatusError = !error.name || error.name !== 'StatusError';
    const notNetworkError = !error.message.startsWith('net::');

    const shouldSendNotification = !debug
        && notNetworkError
        && notStatusError
        && Apify.isAtHome();

    if (shouldSendNotification) {
        const {slackToken} = process.env;
        await postError({slackToken, target, channel});
    }
};

module.exports = {
    log,
    tryRequire,
    getOptions,
    getUserAgent,
    getProxyConfiguration,
    transformTasks,
    resolveTaskTree,
    getPage,
    decorate,
    extendLog,
    urlLogger,
    responseErrorLogger,
    initEventLoggers,
    decrypt,
    decryptObject,
    deepTransform,
    redactOptions,
    redactObject,
    decoratePage,
    startServer,
    saveOutput,
    savePageContent,
    saveScreenshot,
    sendNotification,
};
