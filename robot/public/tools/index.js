const {
    log,
    tryRequire,
    credentialsEncrypted,
    decryptCredentials,
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
    redactObject,
    saveOutput,
    savePageContent,
    saveScreenshot,
    ...require('./pptr'),
    ...require('./tools'),
};
