const Apify = require('apify');

const {log} = Apify.utils;

const {redactObject} = require('../tools/generic');

const extendLog = (log, id) => {
    log.default = (...args) => console.log(...args);
    log.redact = {
        object: (...args) => {
            args = args.map(arg =>
                typeof arg === 'object' ?
                    redactObject(JSON.parse(JSON.stringify(arg))) :
                    arg);

            log.default(...args);
        },
    };

    log.id = {
        info: (id => message => log.info(`${id} ${message}`))(id),
        debug: (id => message => log.debug(`${id} ${message}`))(id),
        error: (id => message => log.error(`${id} ${message}`))(id),
        warning: (id => message => log.warning(`${id} ${message}`))(id),
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
};

extendLog(log);

module.exports = log;
