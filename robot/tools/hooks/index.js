const {
    PUPPETEER,
} = require('../../consts');

const {
    CustomError,
} = require('../../errors');

const {
    urlLogger,
    parseDomain,
    responseErrorLogger,
} = require('./tools');

const initEventLoggers = (page, target, url, options = {debug: false}) => {
    const domain = parseDomain(url, target);
    const urlLoggerBound = urlLogger.bind(null, page);
    const responseErrorLoggerBound = responseErrorLogger.bind(null, domain);
    page.on(PUPPETEER.events.domcontentloaded, urlLoggerBound);
    page.on(PUPPETEER.events.response, responseErrorLoggerBound);

    if (options.debug) {
        const responseHandler = domain => async response => {
            const url = response.url();
            const status = response.status();
            console.log(status, domain, url);
            if (!url.startsWith('data:') && url.includes(domain)) {
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
        };

        page.on(PUPPETEER.events.response, responseHandler(domain));
    }
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
    initEventLoggers,
    decoratePage,
};
