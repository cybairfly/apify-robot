// need to access merged config from targets as well
const R = require('ramda');

module.exports = target => {
    const configGlobal = global.rootRequire('./config');
    const configTarget = target && global.tryRequire.global(configGlobal.getPath.configs.robot(target)) || {};

    return R.mergeDeepRight(configGlobal, configTarget);
};
