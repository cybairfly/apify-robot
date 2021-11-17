/**
 * @typedef {import('../../types.d').Robot} Robot
 * @typedef {import('../../types.d').input} input
 * @typedef {import('../../types.d').options} options
 */
const Apify = require('apify');
const log = require('../../logger');

/**
 * @param {Robot}
 * @returns {
    * output: {
        * body: {
            * city: string,
            * country: string,
            * stateCode: string
 * }}}
 */
const getLocation = async ({input, options}) => Apify.call(options.proxy.proximity.locationProviderId, {ip: input.ipAddress});

const getProxyIp = async page => page.evaluate(async () =>
// eslint-disable-next-line no-return-await
    await fetch('https://api.ipify.org/?format=json')
        .then(response => response.json())
        .then(({ip}) => ip))
    .catch(error => null);

/** @param {Robot} */
const getProxyConfig = async robot => {
    const {input: { proxyConfig = {} }, options, location, sessionId} = robot;
    const builtProxyUrl = options.proxy.proximity.enable && buildProxyUrl(location);
    const [inputProxyUrl] = (proxyConfig && proxyConfig.proxyUrls) || [builtProxyUrl];

    const proxyUrl = inputProxyUrl && inputProxyUrl.includes('proxy.apify.com')
        ? inputProxyUrl
            .split('//')
            .map((chunk, index) => index ? `session-${sessionId},${chunk}` : chunk)
            .join('//')
        : inputProxyUrl;

    const proxyOptions = {
        proxyUrls: (proxyUrl && [proxyUrl]) || proxyConfig.proxyUrls,
    };

    // Error: Cannot combine custom proxies with Apify Proxy!It is not allowed to set "options.proxyUrls" or "options.newUrlFunction" combined with "options.groups" or "options.apifyProxyGroups" and "options.countryCode" or "options.apifyProxyCountry".
    if (!proxyOptions.proxyUrls) {
        proxyOptions.groups = proxyConfig.groups || proxyConfig.apifyProxyGroups;
        proxyOptions.countryCode = proxyConfig.countryCode || proxyConfig.country;
    }

    const proxyConfiguration = await Apify.createProxyConfiguration(proxyOptions)
        .catch(error => {
            log.warning(`Proxy config failed! Running without proxy!`);
            log.error(error.message);

            robot.output = {
                _PROXYLESS_: true,
            };

            return null;
        });

    return proxyConfiguration;
};

const buildProxyUrl = location => {
    const customerId = process.env.PROXIMITY_CUSTOMER_ID;
    const proxyToken = process.env.PROXIMITY_PROXY_TOKEN;
    const proxyZone = process.env.PROXIMITY_PROXY_ZONE;
    const proxyHost = process.env.PROXIMITY_PROXY_HOST;
    const country = location.country ? location.country.toLowerCase() : 'us';
    const state = location.stateCode.toLowerCase();
    const city = location.city.replace(/\s/g, '').toLowerCase();
    // eslint-disable-next-line max-len
    return `http://lum-customer-${customerId}-zone-${proxyZone}-country-${country}-state-${state}-city-${city}:${proxyToken}@${proxyHost}`;
};

module.exports = {
    getLocation,
    getProxyIp,
    getProxyConfig,
};
