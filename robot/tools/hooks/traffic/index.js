const log = require('../../../logger');
const {urlParamsToEllipsis, createHeader} = require('../../generic');

const routeFilter = {
	normal: isRouteMatch =>
		route =>
			(isRouteMatch.resource(route) || isRouteMatch.pattern(route)) ?
				route.abort() :
				route.continue(),
	custom: (isRouteMatch, options) => url =>
		route =>
			(isRouteMatch.resource(route) || isRouteMatch.pattern(route)) ?
				(route.abort(), logRouteAbort(route, url, options)) :
				route.continue(),
};

// TODO support Puppeteer?
// TODO merge with debug mode
// PW @ 1.9.0 - The handler will only be called for the first url if the response is a redirect.
const initTrafficFilter = async (page, options) => {
	const {resourceTypes, urlPatterns} = options.trafficFilter;
	const isRouteMatch = {
		pattern: (urlPatterns => route => urlPatterns.some(pattern => route.request().url().includes(pattern)))(urlPatterns),
		resource: (resourceTypes => route => resourceTypes.some(resource => route.request().resourceType().includes(resource)))(resourceTypes),
	};

	interceptNavigation(page)(new URL(page.url()));
	updateTrafficFilter(page, routeFilter.normal(isRouteMatch));

	page.on('navigation', ({url}) => updateTrafficFilter(page, routeFilter.custom(isRouteMatch, options)(url)));
};

const updateTrafficFilter = async (page, filter) => page.route('**/*', filter);

const broadcastNavigation = page => ({url, oldUrl}) => page.emit('navigation', {url, oldUrl});

const interceptNavigation = page => oldUrl =>
	page.waitForURL(url => url.href !== oldUrl.href, {
		waitUntil: 'commit',
	})
		.then(nil => new URL(page.url()))
		.then(url => interceptNavigation(page)(url) && url)
		.then(url => broadcastNavigation(page)({url}) && url);

const logRouteAbort = (route, url, options) => {
	const {fullUrls = false, hostOnly = false, hideFilter = false} = options.debug.traffic;

	const request = route.request();
	const requestUrl = request.url();
	const method = request.method();
	const type = request.resourceType();
	const {host} = url;

	if (!hideFilter) {
		const cols = {
			status: '-'.repeat(3),
			method: method.padEnd(7, '-'),
			type: type.padEnd(11, '-'),
			host: requestUrl.startsWith(host) ? host : '-'.repeat(host.length),
			url: !fullUrls ? urlParamsToEllipsis(requestUrl) : requestUrl,
		};

		log.debug(`█ TX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.host} | ${cols.url}`);
	}
};

module.exports = {
	initTrafficFilter,
};
