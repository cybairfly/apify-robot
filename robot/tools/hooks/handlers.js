const log = require('../../logger');
const {urlParamsToEllipsis} = require('../generic');

module.exports = {
    request: (domain, {fullUrls = false, hostOnly = false}) => async request => {
        const url = request.url();

        const drop = hostOnly
            && (url.startsWith('data:')
            || (hostOnly && !url.includes(domain)));

        if (drop) return;

        const method = request.method();
        const type = request.resourceType();
        // const headers = request.headers();
        // const text = await request.text().catch(() => null);

        const cols = {
            status: '-'.repeat(3),
            method: method.padEnd(7, '-'),
            type: type.padEnd(11, '-'),
            domain: (url.includes(domain) && domain) || '-'.repeat(domain.length),
            url: fullUrls ? url : urlParamsToEllipsis(url),
            // headers,
            // text,
        };

        log.debug(`► TX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);
    },
    response: (domain, {fullUrls = false, hostOnly = false}) => async response => {
        const ok = response.ok();
        const url = response.url();

        const drop = hostOnly
            && (url.startsWith('data:')
            || (hostOnly && !url.includes(domain)));

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
            domain: (url.includes(domain) && domain) || '-'.repeat(domain.length),
            url: fullUrls ? url : urlParamsToEllipsis(url),
            // headers,
            // text,
        };

        log.debug(`◄ RX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);
    },
};
