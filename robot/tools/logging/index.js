const log = require('../../logger');
const { createHeader } = require('../generic');

const logInputs = ({ input, options }) => {
    log.default(createHeader('INPUT', { padder: '▼' }));
    log.redact.object(input);
    log.default(createHeader('INPUT', { padder: '▲' }));

    log.default(createHeader('OPTIONS', { padder: '▼' }));
    log.redact.object(options);
    log.default(createHeader('OPTIONS', { padder: '▲' }));
};

const logOutput = OUTPUT => {
    log.default(' '.repeat(100));
    log.default('OUTPUT');
    log.default('='.repeat(100));
    log.default(OUTPUT);
    log.default(' ');
};

const logError = (error, { retryCount }) => {
    log.exception(error);
    log.default(' '.repeat(100));
    log.default(`RETRY [R-${retryCount}]`);
    log.default('◄'.repeat(100));
}

module.exports = {
    logInputs,
    logOutput,
    logError,
};
