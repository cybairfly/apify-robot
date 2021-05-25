const Apify = require('apify');

// TODO generalize for other channels
const { postMessage } = require('./slack');

const notifyChannel = async ({input, error, options}) => {
    const {channels, details} = options.notify;
    const {channel} = channels.slack;

    const message = formatMessage({input, error, details});

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

const formatMessage = ({input: {target, debug, session, stealth}, error, details}) => {
  const errorLabel = error.type || error.name || '';
  let message = error.message;
  const errorDetails = (debug || details) && JSON.stringify({...error, message, stealth, debug, session, type: error.type, retry: error.retry}, null, 4);

  return `
Error: ${target} \`${errorLabel}\`
https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}${(errorDetails && `
\`\`\`${errorDetails}\`\`\``) || ''}`.trim();
};

module.exports = {
    shouldNotify,
    notifyChannel,
    formatMessage,
};
