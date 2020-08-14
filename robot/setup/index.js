// access merged setup from targets as well
const R = require('ramda');

module.exports = target => {
    const setupGlobal = global.rootRequire('./setup');
    const setupTarget = target && global.tryRequire.global(setupGlobal.getPath.targets.setup(target)) || {};

    return R.mergeDeepRight(setupGlobal, setupTarget);
};
