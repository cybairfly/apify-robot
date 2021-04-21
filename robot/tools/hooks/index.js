const log = require('../../logger');
const { EVENTS, LOGGER, SERVER, SESSION } = require('../../consts');
const { errors, RobotError } = require('../../errors');

const handlers = require('./handlers');

const {
    abortRoute,
    responseErrorLogger,
    urlLogger,
} = require('./tools');

// TODO merge with debug mode
// PW @ 1.9.0 - The handler will only be called for the first url if the response is a redirect.
const initTrafficFilter = async (page, domain, options = {trafficFilter: {resourceTypes: [], urlPatterns: []}}) =>
    page.route('**/*', route => {
        const {resourceTypes, urlPatterns} = options.trafficFilter;
        const patternMatch = urlPatterns.some(pattern => route.request().url().includes(pattern));
        const resourceMatch = resourceTypes.some(resource => route.request().resourceType().includes(resource));

        return (resourceMatch || patternMatch) ?
            abortRoute(route, domain) :
            route.continue();
    });

const initEventLogger = (page, domain, debug, options) => {
    const urlLoggerBound = urlLogger.bind(null, page);
    const responseErrorLoggerBound = responseErrorLogger.bind(null, domain);
    page.on(EVENTS.domcontentloaded, urlLoggerBound);
    page.on(EVENTS.response, responseErrorLoggerBound);

    // TODO expose debug options on input
    if (debug) {
        page.on(EVENTS.request, handlers.request(domain, options));
        page.on(EVENTS.response, handlers.response(domain, options));
    }
};

const decoratePage = (page, server, session) => {
    page.gotoDom = async (url, options = {}) => page.goto(url, {
        waitUntil: EVENTS.domcontentloaded,
        ...options,
    });

    page.typeHuman = async (selector, text, options) => {
        const characters = text.split('');

        for (const character of characters)
            await page.type(selector, character, {...options, delay: Math.random() * 100});
    };

    const decorateGoto = async (page, args, originalMethod) => {
        const response = await originalMethod.apply(page, args);
        const statusCode = response.status();

        if (statusCode >= 400) {
            const retireSession = SESSION.retireStatusCodes.some(code => code === statusCode);

            if (retireSession)
                throw new errors.session.Retire({statusCode});

            else
                throw new errors.Status({statusCode});
        }

        return response;
    };

    LOGGER.triggerMethods.map(methodName => {
        const originalMethod = page[methodName];

        if (server && SERVER.livecast.triggerMethods.some(liveViewMethodName => methodName.includes(liveViewMethodName))) {
            page[methodName] = async (...args) => {
                const argsForLog = args => args.map(arg => typeof arg === 'function' ? arg.toString().replace(/\s+/g, ' ') : arg);
                console.log({[methodName]: argsForLog(args)});

                try {
                    const result = await originalMethod.apply(page, args);
                    await server.serve(page);
                    return Promise.resolve(result);
                } catch (error) {
                    await server.serve(page);
                    log.error(error);
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
                    return decorateGoto(page, args, originalMethod);

                return originalMethod.apply(page, args);
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
