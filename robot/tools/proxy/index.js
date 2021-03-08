const Apify = require('apify');

const getProxyConfig = async ({actorInput: { proxyConfig = {} }, sessionId}) => {
    const [inputProxyUrl] = (proxyConfig && proxyConfig.proxyUrls) || [];
    // FIXME
    const proxyUrl = inputProxyUrl && inputProxyUrl.includes('proxy.apify.com')
        ? inputProxyUrl
            .split('//')
            .map((chunk, index) => index ? `session-${sessionId},${chunk}` : chunk)
            .join('//')
        : inputProxyUrl;

    const proxyConfiguration = await Apify.createProxyConfiguration({
        proxyUrls: (proxyUrl && [proxyUrl]) || proxyConfig.proxyUrls,
        groups: proxyConfig.groups || proxyConfig.apifyProxyGroups,
        countryCode: proxyConfig.countryCode || proxyConfig.country,
    });

    return proxyConfiguration;
};

module.exports = {
    getProxyConfig,
};
