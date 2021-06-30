const log = require('../../logger');
const {trimUrl} = require('../generic');

module.exports = {
    request: (domain, domainRegex, options) => async request => {
        const {fullUrls = false, hostOnly = false} = options.debug.traffic;

        const url = request.url();
        const drop = hostOnly && !domainRegex.test(url);
        if (drop) return;

        const method = request.method();
        const type = request.resourceType();
        // const headers = request.headers();
        // const text = await request.text().catch(() => null);

        const cols = {
            status: '-'.repeat(3),
            method: method.padEnd(7, '-'),
            type: type.padEnd(11, '-'),
            domain: domainRegex.test(url) ? domain : '-'.repeat(domain.length),
            url: fullUrls ? url : trimUrl(url),
            // headers,
            // text,
        };

        log.debug(`► TX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);
    },
    response: (domain, domainRegex, options) => async response => {
        const {fullUrls = false, hostOnly = false} = options.debug.traffic;

        const ok = response.ok();
        const url = response.url();
        const drop = hostOnly && !domainRegex.test(url);
        if (drop) return;

        const status = response.status();
        const method = response.request().method();
        const type = response.request().resourceType();
        // const headers = response.headers();
        // const text = await response.text().catch(() => null);

        const cols = {
            status: (ok && '√OK') || status.toString(),
            method: method.padEnd(7, '-'),
            type: type.padEnd(11, '-'),
            domain: domainRegex.test(url) ? domain : '-'.repeat(domain.length),
            url: fullUrls ? url : trimUrl(url),
            // headers,
            // text,
        };

        log.debug(`◄ RX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);
    },
};
