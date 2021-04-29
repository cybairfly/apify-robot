const {InputOptions} = require('../options/index');

// TODO clean up input
const extendInput = input => input.options = InputOptions(input);

module.exports = {
    extendInput,
};
