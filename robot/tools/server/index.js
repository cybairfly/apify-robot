const {Server} = require('../../server');

const startServer = (page, setup, options) => {
    const server = new Server(page, setup, options);

    server.start();
    return server;
};

module.exports = {
    startServer,
};
