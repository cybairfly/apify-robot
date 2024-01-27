const log = require('../../../logger');
const {EVENTS} = require('../../../consts');

const {handlers} = require('../traffic/handlers');
const {createHeader} = require('../../generic');
const {parseTargetDomain} = require('../../target');

const urlLogger = (page, {debug}) => oldUrl => event => {
	const url = new URL(page.url());
	if (url?.href !== oldUrl?.href) {
		console.log({host: url.host});
		console.log({url: url.href});
	}
};

const navigationLogger = ({debug}) => event => debug && console.log(createHeader(EVENTS.framenavigated, {center: true, padder: '›'}));

const resetHandler = {
	navigation: (eventName = EVENTS.framenavigated) => (page, handler) => (oldUrl, oldHandler) => event => {
		const url = new URL(page.url());

		if (oldHandler)
			page.once(eventName, handler(url));
		else
			handler({})(event);

		page.once(EVENTS.framenavigated, resetHandler.navigation(eventName)(page, handler)(url, true));
	},
	traffic: eventName => (page, handler) => (oldUrl = {}, oldHandler) => event => {
		const url = new URL(page.url());

		if (url?.href === oldUrl?.href || url?.host === oldUrl?.host) {
			page.once(EVENTS.framenavigated, resetHandler.traffic(eventName)(page, handler)(url, oldHandler));

			return;
		}

		const currentHandler = handler(url);
		page.on(eventName, currentHandler);

		if (oldHandler)
			page.off(eventName, oldHandler);
		else
			page.once(EVENTS.framenavigated, resetHandler.traffic(eventName)(page, handler)(url, currentHandler));
	},
};

const initEventLogger = ({page, input, options}) => {
	page.once(EVENTS.framenavigated, resetHandler.navigation(EVENTS.framenavigated)(page, urlLogger(page, {debug: input.debug}))());

	if (input.debug) {
		page.on(EVENTS.framenavigated, navigationLogger(input));
		page.on(EVENTS.domcontentloaded, () => console.log(createHeader(EVENTS.domcontentloaded, {center: true, padder: '○'})));
		page.on(EVENTS.load, () => console.log(createHeader(EVENTS.load, {center: true, padder: '●'})));

		if (options.debug.traffic.enable) {
			page.once(EVENTS.framenavigated, resetHandler.traffic(EVENTS.request)(page, handlers.request(options))());
			page.once(EVENTS.framenavigated, resetHandler.traffic(EVENTS.response)(page, handlers.response(options))());
		}
	}
};

module.exports = {
	initEventLogger,
};
