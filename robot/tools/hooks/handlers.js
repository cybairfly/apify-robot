const log = require('../../logger');

module.exports = {
    request: {},
    response: (domain, {trimUrls = true, hostOnly = false}) => async response => {
        const ok = response.ok();
        const url = response.url();
        const drop = hostOnly
            && (url.startsWith('data:')
            || (hostOnly && !url.includes(domain)));

        if (drop) return;

        const status = response.status();
        const method = response.request().method();
        const type = response.request().resourceType();
        const headers = response.headers();
        const text = await response.text().catch(() => null);
        const urlCutOffIndex = trimUrls && url.indexOf('?') + 1;

        const cols = {
            status: (ok && '√OK') || status.toString(),
            method: method.padEnd(7, '-'),
            type: type.padEnd(11, '-'),
            domain: (url.includes(domain) && domain) || '-'.repeat(domain.length),
            url: (trimUrls && urlCutOffIndex) ?
                `${url.slice(0, urlCutOffIndex)}...` :
                url,
            // headers,
            // text,
        };

        // log.default(cols);
        log.debug(`${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);
    },
};
