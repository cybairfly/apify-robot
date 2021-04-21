const {InputOptions} = require('../options/index');

// TODO clean up input
const parseInput = input => ({
    ...input,
    options: InputOptions(input),
});

module.exports = {
    parseInput,
};
