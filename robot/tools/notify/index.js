const Apify = require('apify');

const { postError } = require('./slack');

const notifyChannel = async ({actorInput, channel, error}) => {
    const {debug, target} = actorInput;

    const notStatusError = !error.name || error.name !== 'StatusError';
    const notNetworkError = !error.message.startsWith('net::');

    const shouldSendNotification = !debug
        && notNetworkError
        && notStatusError
        && Apify.isAtHome();

    if (shouldSendNotification) {
        const {slackToken} = process.env;
        await postError({slackToken, target, channel});
    }
};

module.exports = {
    notifyChannel,
};
