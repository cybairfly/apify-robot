const log = require('../../logger');
const { EVENTS, LOGGER, SERVER, SESSION } = require('../../consts');
const { errors, RobotError } = require('../../errors');

const handlers = require('./handlers');

const {
    abortRoute,
    urlLogger,
    preloadUrlLogger,
    responseErrorLogger,
} = require('./tools');

const {
    logify,
    decorateInstance,
} = require('./page');

const {createHeader} = require('../generic');

// TODO support Puppeteer?
// TODO merge with debug mode
// PW @ 1.9.0 - The handler will only be called for the first url if the response is a redirect.
const initTrafficFilter = async (page, domain, options) =>
    page.route('**/*', route => {
        const {resourceTypes, urlPatterns} = options.trafficFilter;
        const patternMatch = urlPatterns.some(pattern => route.request().url().includes(pattern));
        const resourceMatch = resourceTypes.some(resource => route.request().resourceType().includes(resource));

        return (resourceMatch || patternMatch) ?
            abortRoute(route, domain, options) :
            route.continue();
    });

const initEventLogger = ({page, domain, input, options}) => {
    const urlLoggerPreloaded = preloadUrlLogger(page, {debug: input.debug});
    const responseErrorLoggerBound = responseErrorLogger.bind(null, domain);
    page.on(EVENTS.framenavigated, urlLoggerPreloaded);
    page.on(EVENTS.response, responseErrorLoggerBound);

    if (input.debug) {
        page.on(EVENTS.domcontentloaded, () => log.default(createHeader(EVENTS.domcontentloaded, {center: true, padder: '○'})));
        page.on(EVENTS.load, () => log.default(createHeader(EVENTS.load, {center: true, padder: '●'})));
    }

    if (input.debug && options.debug.traffic.enable) {
        const domainRegex = new RegExp(`//[^/]*${domain}[.].*/`, 'i');
        page.on(EVENTS.request, handlers.request(domain, domainRegex, options));
        page.on(EVENTS.response, handlers.response(domain, domainRegex, options));
    }
};

module.exports = {
    initEventLogger,
    initTrafficFilter,
    decorateInstance,
    logify,
};
