const log = require('../../../logger');
const { EVENTS } = require('../../../consts');

const {handlers} = require('../traffic/handlers');
const {createHeader} = require('../../generic');

const urlLogger = (page, {debug}) => async () => {
    const url = await page.evaluate(() => window.location.href).catch(() => null);

    if (debug)
        log.default(createHeader(EVENTS.framenavigated, {center: true, padder: '›'}));

    if (url) log.default({url});
};

const preloadUrlLogger = (page, options) => urlLogger(page, options);

// TODO merge with handlers
const responseErrorLogger = async (domain, response) => {
    const url = response.url();
    const status = response.status();
    // console.log(status, domain, url);
    if (!url.startsWith('data:') && url.includes(domain)) {
        if (status >= 400 && status !== 404) {
            const headers = response.headers();
            const text = await response.text().catch(() => null);
            const requestUrl = await response.request().url();
            const requestHeaders = await response.request().headers();
            const requestPostData = await response.request().postData();
            console.log(status, url, {
                headers,
                text,
                requestUrl,
                requestHeaders,
                // requestPostData
            });
        }
    }
};

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
};
