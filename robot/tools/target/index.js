const {parseDomain, fromUrl} = require('parse-domain');

const getTargetUrl = (setup, target) => {
    const source = tryRequire.global(setup.getPath.targets.config(target)) || tryRequire.global(setup.getPath.targets.setup(target)) || {};
    return source.TARGET && source.TARGET.url;
};

const parseTargetDomain = (url, target) => {
    return parseDomain(fromUrl(url)).domain || target;
};

module.exports = {
    getTargetUrl,
    parseTargetDomain,
};
