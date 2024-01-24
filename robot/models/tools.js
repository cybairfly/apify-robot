const inputSchema = require('../../INPUT_SCHEMA.json');
const {parseInputOptions} = require('../tools/options');

/**
 * @param {import('../../INPUT_SCHEMA.json')} inputSchema
 */
function getInputModel(inputSchema) {
	const extractDefaults = ([key, value]) => [key, value.default ?? null];

	const inputEntries = Object.entries(inputSchema.properties);
	const inputProps = {
		deep: parseInputOptions(Object
			.fromEntries(inputEntries
				.filter(([key]) => key.includes('options.'))
				.map(extractDefaults))),
		flat: Object
			.fromEntries(inputEntries
				.filter(([key]) => !key.includes('options.'))
				.map(extractDefaults)),
	};

	return {
		...inputProps.flat,
		options: inputProps.deep,
	};
}

module.exports = {
	getInputModel,
};
