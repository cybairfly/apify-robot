const {
    log,
    tryRequire,
    decrypt,
    decryptObject,
    deepTransform,
    redactObject,
    saveOutput,
    savePageContent,
    saveScreenshot,
    // sendNotification,
} = require('../../tools');

module.exports = {
    log,
    tryRequire,
    decrypt,
    decryptObject,
    redactObject,
    saveOutput,
    savePageContent,
    saveScreenshot,
    ...require('./pptr'),
    ...require('./tools'),
};
