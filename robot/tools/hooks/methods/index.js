const {errors} = require('cyber-codex');

const log = require('../../../logger');
const {SESSION} = require('../../../consts');
const {RobotError} = require('../../../errors');

const isAsync = method => method && Object.getPrototypeOf(method).constructor.name === 'AsyncFunction';

/**
 * Decorates instance methods with extended behavior.
 * @param {Object} options
 */
const decorateFunction = {
	navigation: ({methodName, instance}) => {
		const originalMethod = instance[methodName];

		instance[methodName] = async (...args) => {
			decorators.logger({methodName, args});

			const response = await originalMethod.apply(instance, args);
			decorators.goto(response);
			return response;
		};
	},
	default: ({methodName, instance}) => {
		const originalMethod = instance[methodName];

		instance[methodName] = isAsync(originalMethod) ?
			async (...args) => {
				decorators.logger({methodName, args});
				return originalMethod.apply(instance, args);
			} : (...args) => {
				decorators.logger({methodName, args});
				return originalMethod.apply(instance, args);
			};
	},
	backup: ({methodName, instance}) => {
		const originalMethod = instance[methodName];

		instance[methodName] = isAsync(originalMethod) ?
			async (...args) => {
				decorators.logger({methodName, args});
				return originalMethod.apply(instance, args);
			} : (...args) => {
				decorators.logger({methodName, args});
				return originalMethod.apply(instance, args);
			};

		instance[methodName]._original = originalMethod.bind(instance);
	},
	secret: ({methodName, instance}) => {
		const originalMethod = instance[methodName];

		instance[methodName] = isAsync(originalMethod) ?
			async (...args) => {
				decorators.secretLogger({methodName, args});
				return originalMethod.apply(instance, args);
			} : (...args) => {
				decorators.secretLogger({methodName, args});
				return originalMethod.apply(instance, args);
			};

		instance[methodName]._original = originalMethod.bind(instance);
	},
	server: ({methodName, instance, server, page}) => {
		const originalMethod = instance[methodName];

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
	},
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
		console.log({[methodName]: formatArguments(args)});
	},
	secretLogger: async ({methodName, args}) => {
		console.log({[methodName]: formatArguments(sanitizeArguments(args))});
	},
};

const formatArguments = args =>
	args.map(arg =>
		typeof arg !== 'function' ?
			arg :
			arg.toString().replace(/\s+/g, ' '));

const sanitizeArguments = args => {
	const [
		selector,
		text = '',
		...restArgs
	] = args;

	return [
		selector,
		'*'.repeat(text.length),
		...restArgs,
	];
};

module.exports = {
	decorateFunction,
};
