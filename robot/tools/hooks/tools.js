const {EVENTS} = require('../../consts');
const log = require('../../logger');
const {urlParamsToEllipsis, createHeader} = require('../generic');

const abortRoute = (route, domain, options) => {
    const {fullUrls = false, hostOnly = false, hideFilter = false} = options.debug.traffic;

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

module.exports = {
    abortRoute,
    urlLogger,
    preloadUrlLogger,
    responseErrorLogger,
};
