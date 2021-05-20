module.exports = {
    target: {
        login: {
            name: 'Login',
            message: 'Match not found',
        },
        search: {
            name: 'Search',
            message: 'Match not found',
        },
        status: {
            retry: false,
            name: 'ResponseStatus',
            message: 'Received bad response status',
        },
        loginStatus: {
            retry: true,
            name: 'LoginStatus',
            message: 'Login failed - check credentials',
        },
    },
};
