const {InputOptions} = require('../options/index');

// TODO clean up input
const extendInput = async ({input, setup}) => {
	input.proxyConfig = input.proxyConfig || {};
	input.proxyConfig.groups = input.proxyConfig.groups || [];
	input.id = await setup.getInputId(input);
	input.options = InputOptions(input);

	return {
		...input,
		...setup.input,
	};
};

module.exports = {
	extendInput,
};
