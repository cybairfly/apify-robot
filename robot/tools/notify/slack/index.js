const Slack = require('slack-node');

async function postMessage(slack, channel, text) {
    slack = new Slack(process.env.SLACK_TOKEN);

    return new Promise((resolve, reject) => {
        slack.api('chat.postMessage', {
            text,
            channel,
        }, (err, response) => {
            if (err)
                reject(err);
            else
                resolve(response);
        });
    });
}

module.exports = {
    postMessage,
};
