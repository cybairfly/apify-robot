const Apify = require('apify');
const { errors } = require('cyber-codex');
// const { errors, RobotError } = require('../../errors');

// TODO generalize for other channels
const { postMessage } = require('./slack');

const notifyChannel = async ({input, error, options}) => {
	const {channels} = options.notify;
	const {channel} = channels.slack;

	const message = formatMessage({input, error, options});

	await postMessage({channel, message});
};

const shouldNotify = ({input, error, setup, options}) =>
	input.notify
    && options.notify.slack
    && !options.debug.muted
    && !input.silent
    && !error.silent
    && !shouldExclude(error, setup.options.notify.filters)
    && Apify.Actor.isAtHome();

const shouldExclude = (error, filters = {}) => Object
	.values(filters)
	.flatMap(filter => filter)
	.some(pattern => error.name === pattern || error.type === pattern);

const formatMessage = ({input: {target, block, debug, retry, session, stealth}, error, options}) => {
	const {details, verbose, visuals} = options.notify;
	const filterPatterns = [
		'=========================== logs',
		'to capture Playwright logs',
	];

	const errorLabel = error.type || error.name || '';
	const modifyError = !verbose && filterPatterns.some(pattern => error.message.includes(pattern));
	if (modifyError)
		error.message = 'Playwright error message detected. Please visit the Apify run URL for error details.';

	const unknownError = error.unknown || error instanceof errors.Unknown;
	if (unknownError)
		error.unknown = true;

	const errorDetails = (debug || details) && JSON.stringify({
		input: {retry, block, debug, session, stealth},
		error: JSON.parse(JSON.stringify(error)),
	}, null, 4);

	const message = `
Error: ${target} \`${errorLabel}\` ${visuals ? (`${debug ? ':ladybug:' : ''}${stealth ? ':ninja:' : ''}${session ? ':cookie:' : ''}${block ? ':no_entry:' : ''}${retry && error.retry ? ':recycle:' : ''}${error.unknown ? ':warning:' : ''}`) : ''}
https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}${(errorDetails && `
\`\`\`${errorDetails}\`\`\``) || ''}`.trim();

	return message;
};

module.exports = {
	shouldNotify,
	notifyChannel,
	formatMessage,
};
