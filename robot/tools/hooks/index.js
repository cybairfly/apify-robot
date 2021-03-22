const log = require('../../logger');
const { PUPPETEER } = require('../../consts');
const { CustomError } = require('../../errors');

const handlers = require('./handlers');

const {
    abortRoute,
    parseDomain,
    responseErrorLogger,
    urlLogger,
} = require('./tools');

// TODO merge with debug mode
const initTrafficFilter = async (page, options) =>
    page.route('**/*', route => {
        const {resourceTypes, urlPatterns} = options.trafficFilter;
        const patternMatch = urlPatterns.some(pattern => route.request().url().includes(pattern));
        const resourceMatch = resourceTypes.some(resource => route.request().resourceType().includes(resource));

        return (resourceMatch || patternMatch) ? abortRoute(route) : route.continue();
    });

const initEventLogger = (page, target, url, options = {debug: false, trimUrls: true, hostOnly: false}) => {
    const domain = parseDomain(url, target);
    const urlLoggerBound = urlLogger.bind(null, page);
    const responseErrorLoggerBound = responseErrorLogger.bind(null, domain);
    page.on(PUPPETEER.events.domcontentloaded, urlLoggerBound);
    page.on(PUPPETEER.events.response, responseErrorLoggerBound);

    if (options.debug)
        page.on(PUPPETEER.events.response, handlers.response(domain, options));
};

const decoratePage = (page, server) => {
    page.gotoDom = async (url, options = {}) => page.goto(url, {
        waitUntil: PUPPETEER.events.domcontentloaded,
        ...options,
    });

    page.typeHuman = async (selector, text, options) => {
        const characters = text.split('');

        for (const character of characters)
            await page.type(selector, character, {...options, delay: Math.random() * 100});
    };

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

        if (PUPPETEER.page.methodsNames.liveView.some(liveViewMethodName => methodName.includes(liveViewMethodName))) {
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
                // SANITIZE SENSITIVE DATA
                const getArgsForLog = args => {
                    if (methodName === 'type') {
                        const [selector, text, ...restArgs] = args;
                        return [selector, ...restArgs];
                    }

                    return args.map(arg => typeof arg === 'function' ?
                        arg
                            .toString()
                            .replace(/\s+/g, ' ') :
                        arg);
                };

                console.log({[methodName]: getArgsForLog(args)});

                if (methodName === 'goto')
                    return await decorateGoto(page, args, originalMethod);

                return await originalMethod.apply(page, args);
            };
        }
    });

    return page;
};

module.exports = {
    decoratePage,
    initEventLogger,
    initTrafficFilter,
};
