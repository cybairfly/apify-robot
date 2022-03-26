const log = require('../../../logger');
const {SESSION} = require('../../../consts');
const { errors, RobotError } = require('../../../errors');

/**
 * Decorates instance methods with extended behavior.
 * @param {Object} options
 */
const decorateMethod = ({methodName, page, instance, server = null}) => {
    const originalMethod = instance[methodName];

    if (server) {
        instance[methodName] = async (...args) => {
            try {
                const result = await originalMethod.apply(instance, args);
                await server.serve(page);
                return Promise.resolve(result);
            } catch (error) {
                await server.serve(instance);
                log.error(error);
                throw error;
            }
        };
    } else {
        instance[methodName] = async (...args) => {
            if (methodName === 'goto') {
                const response = await originalMethod.apply(instance, args);
                decorators.logger({methodName, args});
                decorators.goto(response);
                return response;
            }

            decorators.logger({methodName, args});
            return originalMethod.apply(instance, args);
        };
    }
};

const decorators = {
    goto: async response => {
        const statusCode = response.status();

        if (statusCode >= 400) {
            const retireSession = SESSION.retireStatusCodes.some(code => code === statusCode);

            if (retireSession)
                throw new errors.session.Retire({statusCode});

            else
                throw new errors.Status({statusCode});
        }
    },
    logger: async ({methodName, args}) => {
        console.log({[methodName]: formatArguments(sanitizeArguments({methodName, args}))});
    },
};

const formatArguments = args =>
    args.map(arg =>
        typeof arg !== 'function' ?
            arg :
            arg.toString().replace(/\s+/g, ' '));

const sanitizeArguments = ({methodName, args}) => {
    if (methodName !== 'type') return args;

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
};

module.exports = {
    decorateMethod,
};
