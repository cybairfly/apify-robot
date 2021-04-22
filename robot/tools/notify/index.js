const Apify = require('apify');

const { postMessage } = require('./slack');

const formatMessage = (target, errorLabel, errorDetails) => `
Error: ${target} \`${errorLabel}\`
https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}${(errorDetails && `
\`\`\`${errorDetails}\`\`\``) || ''}`.trim();

const notifyChannel = async ({input, setup, error}) => {
    const {filters, channels, details} = setup.options.notify;
    const {channel} = channels.slack;
    const {debug, target} = input;

    const exclude = Object
        .values(filters)
        .flatMap(filter => filter)
        .some(pattern => error.name === pattern || error.type === pattern);

    const doNotify = !debug && !exclude && Apify.isAtHome();

    if (doNotify) {
        const errorLabel = error.type || error.name || '';
        const errorDetails = details && JSON.stringify(error, null, 4);
        const message = formatMessage(target, errorLabel, errorDetails);
        await postMessage({channel, message});
    }
};

module.exports = {
    notifyChannel,
};
