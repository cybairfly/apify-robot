/**
 * @typedef {import('playwright').Page} page
 * @typedef {import('playwright').Frame} frame
 * @typedef {import('../../public/tools/types').debug} debug
 */

const log = require('../../logger');
const { errors, RobotError } = require('../../errors');
const {EVENTS, LOGGER, SERVER, SESSION} = require('../../consts');

const sanitizeArguments = (args, methodName) => {
    if (methodName === 'type') {
        const [
            selector,
            text,
            ...restArgs
        ] = args;

        return [
            selector,
            '*'.repeat(text.length),
            ...restArgs,
        ];
    }

    return args
        .map(arg =>
            typeof arg !== 'function' ?
                arg :
                arg.toString().replace(/\s+/g, ' '));
};

const instanceDecorators = {
    goto: async (page, args, originalMethod) => {
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
    },
    gotoDom: instance => {
        instance.gotoDom = async (url, options = {}) => instance.goto(url, {
            waitUntil: EVENTS.domcontentloaded,
            ...options,
        });

        return instance;
    },
    typeHuman: instance => {
        instance.typeHuman = async (selector, text, options) => {
            const characters = text.split('');

            for (const character of characters)
                await instance.type(selector, character, {...options, delay: Math.random() * 100});
        };
    },
};

const decorateMethod = {
    regular: ({instance, methodName, originalMethod}) => {
        instance[methodName] = async (...args) => {
            console.log({[methodName]: sanitizeArguments(args, methodName)});

            if (methodName === 'goto')
                return instanceDecorators.goto(instance, args, originalMethod);

            return originalMethod.apply(instance, args);
        };
    },
    server: ({instance, server, methodName, originalMethod}) => {
        instance[methodName] = async (...args) => {
            const argsForLog = args => args.map(arg => typeof arg === 'function' ? arg.toString().replace(/\s+/g, ' ') : arg);
            console.log({[methodName]: argsForLog(args)});

            try {
                const result = await originalMethod.apply(instance, args);
                await server.serve(instance);
                return Promise.resolve(result);
            } catch (error) {
                await server.serve(instance);
                log.error(error);
                throw error;
            }
        };
    },
};

/**
 * Decorates instance methods with automated logging and extends it with extra utility methods.
 * @param instance - instance to be decorated (page, frame, etc...)
 * @param server - The server instance.
 * @returns Decorated instance.
 */
const decorateInstance = (instance, server) => {
    instanceDecorators.gotoDom(instance);
    instanceDecorators.typeHuman(instance);
    logify(instance, server);

    return instance;
};

// TODO include element handle + evaluations
/**
 * Decorates instance methods with automated logging.
 * @param instance - instance to be decorated (page, frame, etc...)
 * @param server - The server instance.
 * @returns Decorated instance.
 */
const logify = (instance, server) => {
    LOGGER.triggerMethods.page.map(methodName => {
        const originalMethod = instance[methodName];
        const isServerMethod = server && SERVER.interface.triggerMethods.some(triggerMethod => methodName.includes(triggerMethod));

        if (isServerMethod)
            decorateMethod.server({instance, server, methodName, originalMethod});
        else
            decorateMethod.regular({instance, methodName, originalMethod});
    });

    if (instance.keyboard) {
        LOGGER.triggerMethods.keyboard.map(methodName => {
            const originalMethod = instance[methodName];
            decorateMethod.regular({instance, methodName, originalMethod});
        });
    }

    return instance;
};

module.exports = {
    logify,
    decorateInstance,
};
