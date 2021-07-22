const Apify = require('apify');
const path = require('path');

const log = require('../../logger');
const {EVENTS, SERVER} = require('../../consts');
const {InterfaceServer} = require('interface-server');

const {RobotError} = require('../../errors');

const startServer = (page, setup, options) => {

    const promptHandlers = {
        [SERVER.interface.events.abort]: () => {
            throw new RobotError({
                data: {
                    abortActor: true,
                },
            });
        },
        [SERVER.interface.events.cancel]: () => {
            throw new RobotError({
                data: {
                    abortAction: true,
                },
            });
        },
        [SERVER.interface.events.confirm]: () => {
            log.info('Payment confirmed');
        },
    };
    
    const server = new InterfaceServer({ promptHandlers });
    page.on(EVENTS.load, async () => server.serve(page));

    server.start();
    return server;
};

module.exports = {
    startServer,
};
