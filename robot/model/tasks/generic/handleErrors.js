const Apify = require('apify');
const Robot = require('apify-robot');

const { matchPattern, iteratePatterns } = Robot.tools;

const {
	consts: {tasks, steps},
	outputs,
} = require('../../robot');

module.exports = async ({ page, step, input: {target} }, {error, setup, retryCount}) => {
	step.will('handle errors, patterns and edge cases');

	if (error instanceof Robot.Error === false)
		error = new Robot.errors.Unknown({error, retry: true, rotateSession: true});

	const {
		PATTERNS = {},
	} = global.tryRequire.global(setup.getPath.targets.config(target)) || {};

	if (PATTERNS.isKnownError) {
		const isTargetError = await matchPattern(page, PATTERNS.isKnownError);
		if (isTargetError) {
			if (retryCount)
				throw new Robot.errors.Retry({message: 'Retry - target error'});
			else
				return outputs.isKnownError;
		}
	}

	const pattern = await iteratePatterns(page, PATTERNS);
	if (pattern)
		error.data = {pattern};

	throw error;
};
