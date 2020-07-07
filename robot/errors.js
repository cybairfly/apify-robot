const CustomError = ({ retry = false, getData = false, name = 'CustomError', data = {}, message = 'Custom Error' }, extras = {}) => {
    const error = Error(extras.message || message);
    error.name = extras.name || `${name}Error`;
    error.data = {
        ...data,
        ...extras.data
    };

    return error;
};

const ERROR = {
    target: {
        login: {
            name: 'Login',
            message: `Match not found`
        },
        search: {
            name: 'Search',
            message: `Match not found`
        },
        status: {
            retry: false,
            name: 'ResponseStatus',
            message: `Received bad response status`
        },
        loginStatus: {
            retry: true,
            name: 'LoginStatus',
            message: `Login failed - check credentials`
        }
    },
};

module.exports = {
    CustomError,
    ERROR
};
