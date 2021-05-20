const {InputOptions} = require('../options/index');

// TODO clean up input
const extendInput = async (input, setup) => {
    input.id = await setup.getInputId(input);
    input.options = InputOptions(input);

    return input;
};

module.exports = {
    extendInput,
};
