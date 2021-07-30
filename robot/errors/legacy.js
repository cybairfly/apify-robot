const CustomError = ({ retry = false, getData = false, name = 'CustomError', data = {}, message = 'Custom Error' }, extras = {}) => {
    const error = Error(extras.message || message);
    error.name = extras.name || `${name}Error`;
    error.data = {
        ...data,
        ...extras.data,
    };

    return error;
};

module.exports = {
    CustomError,
};
