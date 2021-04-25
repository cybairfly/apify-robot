const Apify = require('apify');
const path = require('path');
// const {log: defaultLog} = Apify.utils;

const log = require('../../logger');
const {EVENTS} = require('../../consts');
const {Server} = require('../../server/index');

const startServer = (page, setup, options) => {
    const server = new Server(page, setup, options);
    // page.on(EVENTS.domcontentloaded, async () => await server.serve(page));
    page.on(EVENTS.load, async () => server.serve(page));

    server.start();
    return server;
};

module.exports = {
    startServer,
};
