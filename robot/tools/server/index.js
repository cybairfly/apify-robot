const Apify = require('apify');
const path = require('path');
// const {log: defaultLog} = Apify.utils;

const log = require('../../logger');

const {
    PUPPETEER,
} = require('../../consts');

const {Server} = require('../../server/index');

const startServer = (page, setup, options) => {
    const server = new Server(page, setup, options);
    // page.on(PUPPETEER.events.domcontentloaded, async () => await server.serve(page));
    page.on(PUPPETEER.events.load, async () => await server.serve(page));

    server.start();
    return server;
};

module.exports = {
    startServer,
};
