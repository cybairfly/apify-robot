const log = require('../../../logger');
const {urlParamsToEllipsis, createHeader} = require('../../generic');

// TODO support Puppeteer?
// TODO merge with debug mode
// PW @ 1.9.0 - The handler will only be called for the first url if the response is a redirect.
const initTrafficFilter = async (page, domain, options) =>
	page.route('**/*', route => {
		const { resourceTypes, urlPatterns } = options.trafficFilter;
		const patternMatch = urlPatterns.some(pattern => route.request().url().includes(pattern));
		const resourceMatch = resourceTypes.some(resource => route.request().resourceType().includes(resource));

		return (resourceMatch || patternMatch) ?
			abortRoute(route, domain, options) :
			route.continue();
	});

const abortRoute = (route, domain, options) => {
	const { fullUrls = false, hostOnly = false, hideFilter = false } = options.debug.traffic;

	const request = route.request();
	const url = request.url();
	const method = request.method();
	const type = request.resourceType();

	if (!hideFilter) {
		const cols = {
			status: '-'.repeat(3),
			method: method.padEnd(7, '-'),
			type: type.padEnd(11, '-'),
			domain: (url.includes(domain) && domain) || '-'.repeat(domain.length),
			url: !fullUrls ? urlParamsToEllipsis(url) : url,
		};

		log.debug(`█ TX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);
	}

	return route.abort();
};

module.exports = {
	initTrafficFilter,
};
