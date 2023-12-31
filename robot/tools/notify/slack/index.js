const Slack = require('slack-node');

async function postMessage({channel, message: text}) {
    const slack = new Slack(process.env.SLACK_TOKEN);

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
