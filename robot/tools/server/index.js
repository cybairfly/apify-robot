const {Server} = require('../../server');

const maybeStartServer = ({page, input, setup, options}) => {
    // const singleThread = setup.maxConcurrency === 1;
    const shouldStartServer = !this.server && (input.prompt || (input.server && options.server.interface.enable));
    this.server = this.server || (shouldStartServer && startServer(page, setup, options.server.interface));
};

const startServer = (page, setup, options) => {
    const server = new Server(page, setup, options);

    server.start();
    return server;
};

module.exports = {
    maybeStartServer,
    startServer,
};
