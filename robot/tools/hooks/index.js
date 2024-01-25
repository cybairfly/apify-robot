/**
 * @typedef {import('playwright').Page} page
 * @typedef {import('playwright').Frame} frame
 * @typedef {import('../../public/tools/types').debug} debug
 */

const {LOGGER, SERVER} = require('../../consts');

const {extras} = require('./methods/extras');
const {decorateFunction} = require('./methods');

const extendInstance = ({page: instance}) => {
	extras.gotoDom(instance);
	extras.typeHuman(instance);

	return instance;
};

/**
 * Decorates instance methods with automated logging and extends it with extra utility methods.
 * @param {Object} options
 * @param {types.page} options.page - parent page if instance is a frame
 * @param {types.server} options.server - server instance for visual interface bindings
 * @param {types.page | types.frame} options.instance - instance to be decorated (page, frame, etc...) - defaults to page
 * @returns Decorated instance.
 */
const integrateInstance = ({page = null, server = null, instance = page}) => {
	const filter = exclude => method => !exclude.includes(method) && !method.startsWith('_');
	const special = {
		exclude: [
			'constructor',
		],
		backup: [
			'addInitScript',
			'evaluate'
		],
		secret: [
			'fill',
			'type',
		],
		navigation: [
			'goto',
		],
	};

	const exclude = [...special.exclude, ...special.backup, ...special.navigation, ...special.secret];
	const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(filter(exclude));

	decorateFunction.navigation({methodName: 'goto', instance});
	methods.map(methodName => decorateFunction.default({methodName, instance}));
	special.backup.map(methodName => decorateFunction.backup({methodName, instance}));
	special.secret.map(methodName => decorateFunction.secret({methodName, instance}));

	if (instance.keyboard) {
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance.keyboard)).filter(filter(special.exclude));
		methods.map(methodName => decorateFunction.secret({methodName, instance: instance.keyboard}));
	}

	if (instance.mouse) {
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance.mouse)).filter(filter(special.exclude));
		methods.map(methodName => decorateFunction.default({methodName, instance: instance.keyboard}));
	}

	if (server && server.options?.interface?.events?.serveOnEvents)
		server.options.interface.events.eventHooks.map(methodName => decorateFunction.server({methodName, page, server, instance}));

	return instance;
};

module.exports = {
	extendInstance,
	integrateInstance,
};
