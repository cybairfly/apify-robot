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

    // log.debug(`${cols.status} | ${cols.method} | ${cols.type} | ${cols.domain} | ${cols.url}`);

    return route.abort();
};

const parseDomain = (url, target) => {
    try {
        const parsedUrl = new URL(url);
        url = parsedUrl.hostname;
    } catch (error) {
        url = target;
    }

    // TODO improve domain parsing
    const [fallback, domain] = url.split('.').reverse();

    return domain || fallback;
};

const urlLogger = async page => {
    const lastUrl = await page.evaluate(() => window.location.href).catch(() => null);
    if (lastUrl) console.log({lastUrl});
};

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
    parseDomain,
    urlLogger,
    responseErrorLogger,
};
