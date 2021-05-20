const Apify = require('apify');

// TODO generalize for other channels
const { postMessage } = require('./slack');

const notifyChannel = async ({input, error, options}) => {
    const {channels, details} = options.notify;
    const {channel} = channels.slack;
    const {debug, target} = input;

    const errorLabel = error.type || error.name || '';
    const errorDetails = (debug || details) && JSON.stringify(error, null, 4);
    const message = formatMessage({input, error, errorLabel, errorDetails});

    await postMessage({channel, message});
};

const shouldNotify = ({input, error, setup, options}) =>
    input.notify
    && options.notify.slack
    && !options.debug.muteErrors
    && !input.silent
    && !error.silent
    && !shouldExclude(error, setup.options.notify.filters)
    && Apify.isAtHome();

const shouldExclude = (error, filters = {}) => Object
    .values(filters)
    .flatMap(filter => filter)
    .some(pattern => error.name === pattern || error.type === pattern);

const formatMessage = ({input: {target, debug, session, stealth}, error, errorLabel, errorDetails}) => `
Error: ${target} \`${errorLabel}\` ${stealth ? ':ninja:' : ''} ${debug ? ':ladybug:' : ''} ${session ? ':cookie:' : ''} ${error.retry ? ':recycle:' : ''}
https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}${(errorDetails && `
\`\`\`${errorDetails}\`\`\``) || ''}`.trim();

module.exports = {
    shouldNotify,
    notifyChannel,
};
