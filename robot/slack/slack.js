const Slack = require('slack-node');

async function postMessage(slack, channel, text) {
    return new Promise((resolve, reject) => {
        slack.api('chat.postMessage', {
            text,
            channel,
        }, (err, response) => {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    });
}

async function postError({slackToken, channel, target, error}) {
    const text = `Error: ${target} \n https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}`;
    const slack = new Slack(slackToken);
    // POST LIVE
    await postMessage(slack, channel, text);
}

module.exports = {
    postError
};
