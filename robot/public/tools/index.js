const pptrTools = require('./pptr');
const publicTools = require('./tools');

const log = require('../../logger');

const {
    tryRequire,
    saveOutput,
    savePageContent,
    saveScreenshot,
    // sendNotification,
} = require('../../tools');

const {
    decrypt,
    decryptObject,
} = require('../../crypto');

const {
    redactObject,
} = require('../../tools/generic');

module.exports = {
    log,
    tryRequire,
    decrypt,
    decryptObject,
    redactObject,
    saveOutput,
    savePageContent,
    saveScreenshot,
    ...pptrTools,
    ...publicTools,
};
