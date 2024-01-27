const log = require('../../logger');
const { createHeader } = require('../generic');

const logInputs = ({ input, options }) => {
	console.log(createHeader('INPUT', { padder: '▼' }));
	log.redact.format.info(input);
	console.log(createHeader('INPUT', { padder: '▲' }));

	console.log(createHeader('OPTIONS', { padder: '▼' }));
	log.redact.format.info(options);
	console.log(createHeader('OPTIONS', { padder: '▲' }));
};

const logOutputUpdate = robot => ({task, step}) => {
	console.log(' '.repeat(100));
	console.log(`TASK [${task.name}] ► STEP [${step.name}] ➜ OUTPUT`);
	console.log('='.repeat(100));
	console.log(robot.step.output);
	console.log(' ');
};

const logOutput = OUTPUT => {
	console.log(' '.repeat(100));
	console.log('OUTPUT');
	console.log('='.repeat(100));
	console.log(OUTPUT);
	console.log(' ');
};

const logError = (error, { retryCount }) => {
	log.exception(error);
	console.log(' '.repeat(100));
	console.log(`RETRY [R-${retryCount}]`);
	console.log('◄'.repeat(100));
};

module.exports = {
	logInputs,
	logOutput,
	logOutputUpdate,
	logError,
};
