const Apify = require('apify');

const {log} = Apify.utils;

const {redactObject} = require('../tools/generic');

log.default = (...args) => console.log(...args);

log.console = {
    info: (...args) => log.getLevel() === log.LEVELS.INFO && console.log('INFO', ...args),
    debug: (...args) => log.getLevel() === log.LEVELS.DEBUG && console.log('DEBUG', ...args),
    error: (...args) => log.getLevel() === log.LEVELS.ERROR && console.error('ERROR', ...args),
    warning: (...args) => log.getLevel() === log.LEVELS.WARNING && console.warn('WARNING', ...args),
};

log.join = {
    info: (...args) => log.info(`${args.join(' ')}`),
    debug: (...args) => log.debug(`${args.join(' ')}`),
    error: (...args) => log.error(`${args.join(' ')}`),
    warning: (...args) => log.warning(`${args.join(' ')}`),
};

log.object = {
    info: object => log.info(`${JSON.stringify(object, null, 2)}`),
    debug: object => log.debug(`${JSON.stringify(object, null, 2)}`),
    error: object => log.error(`${JSON.stringify(object, null, 2)}`),
    warning: object => log.warning(`${JSON.stringify(object, null, 2)}`),
};

log.redact = {
    object: (...args) => {
        args = args.map(arg =>
            typeof arg === 'object' ?
                redactObject(JSON.parse(JSON.stringify(arg))) :
                arg);

        log.default(...args);
    },
};

module.exports = log;
