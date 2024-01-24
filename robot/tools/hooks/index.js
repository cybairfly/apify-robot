/**
 * @typedef {import('playwright').Page} page
 * @typedef {import('playwright').Frame} frame
 * @typedef {import('../../public/tools/types').debug} debug
 */

const {LOGGER, SERVER} = require('../../consts');

const {extras} = require('./methods/extras');
const {decorateMethod} = require('./methods');

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
	LOGGER.triggerMethods.page.map(methodName => decorateMethod({methodName, instance}));

	if (instance.keyboard)
		LOGGER.triggerMethods.keyboard.map(methodName => decorateMethod({methodName, instance: instance.keyboard}));

	if (server && server.options?.interface?.events?.serveOnEvents)
		server.options.interface.events.eventHooks.map(methodName => decorateMethod({ methodName, page, server, instance }));

	return instance;
};

module.exports = {
	extendInstance,
	integrateInstance,
};
