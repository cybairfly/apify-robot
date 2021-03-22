const log = require('../tools/log');

const abortRoute = route => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const type = request.resourceType();

    const cols = {
        status: '►█◄',
        method: method.padEnd(7, '-'),
        type: type.padEnd(11, '-'),
        url,
        // TODO pass host here
        domain: '-'.repeat(10),
    };

    log.debug(`${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);

    return route.abort();
};

// TODO merge with debug mode
const initTrafficFilter = async (page, options) =>
    page.route('**/*', route => {
        const {resourceTypes, urlPatterns} = options.trafficFilter;
        const patternMatch = urlPatterns.some(pattern => route.request().url().includes(pattern));
        const resourceMatch = resourceTypes.some(resource => route.request().resourceType().includes(resource));

        return (resourceMatch || patternMatch) ? abortRoute(route) : route.continue();
    });

module.exports = {
    initTrafficFilter,
};
