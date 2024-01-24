const consts = require('./consts');

const { tasks, steps } = consts;

module.exports = {
	[tasks.login]: {
		steps: [
			{
				name: steps.decryptSecrets,
				skip: ({ state }) => state.skipLogin,
				done: ({ state }) => state.username,
			},
			{
				name: steps.prepareLogin,
				skip: ({ state }) => state.skipLogin,
				done: ({ output }) => output.isLoginReady,
			},
			{
				name: steps.attemptLogin,
				skip: ({ state, output }) => !output.isLoginReady || state.skipLogin,
				done: ({ output }) => output.isLoginSuccess,
			},
		],
		stop: ({ output }) => !output.isValidSession && !output.isLoginSuccess,
	},
	[tasks.action]: {
		init: ({ input, output }) => input.tasks.includes(tasks.action) && output.isLoginSuccess,
		error: steps.handleErrors,
		merge: [tasks.login],
		steps: [
			{
				name: steps.queryProxyIp,
				init: ({ input }) => input.debug,
			},
			{
				name: steps.prepareAccount,
				done: ({ output }) => output.isAccountReady,
			},
			{
				name: steps.prepareAction,
				done: ({ output }) => output.isActionPrepared,
			},
			{
				name: steps.promptAction,
				skip: ({ input: { options } }) => !options.server.interface.enable,
				done: ({ output }) => output.isActionPrompted && output.isActionApproved,
			},
			{
				name: steps.finishAction,
				abort: ({ input, output }) => input.abort && output.isActionAborted === true,
				done: ({ output }) => output.isActionComplete,
			},
			{
				name: steps.verifyAction,
				done: ({ output }) => output.isActionVerified,
			},
			{
				name: steps.handleErrors,
				skip: ({ output }) => true,
			},
		],
	},
};
