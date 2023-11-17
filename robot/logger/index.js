const {log} = require('apify');

const {redactObject} = require('../tools/generic');

const {DEBUG, INFO, WARNING, ERROR} = log.LEVELS;

log.default = (...args) => console.log(...args);

log.console = {
    info: (...args) => [DEBUG, INFO].includes(log.getLevel()) && console.log('INFO', ...args),
    debug: (...args) => log.getLevel() === DEBUG && console.log('DEBUG', ...args),
    error: (...args) => [DEBUG, INFO, WARNING, ERROR].includes(log.getLevel()) && console.error('ERROR', ...args),
    warning: (...args) => [DEBUG, INFO, WARNING].includes(log.getLevel()) && console.warn('WARNING', ...args),
};

log.join = {
    info: (...args) => log.info(`${args.join(' ')}`),
    debug: (...args) => log.debug(`${args.join(' ')}`),
    error: (...args) => log.error(`${args.join(' ')}`),
    warning: (...args) => log.warning(`${args.join(' ')}`),
};

log.object = {
    info: object => log.info(`${JSON.stringify(object, null, 4)}`),
    debug: object => log.debug(`${JSON.stringify(object, null, 4)}`),
    error: object => log.error(`${JSON.stringify(object, null, 4)}`),
    warning: object => log.warning(`${JSON.stringify(object, null, 4)}`),
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
