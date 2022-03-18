const Apify = require('apify');
const http = require('http');
const fs = require('fs');
const {promisify} = require('util');
const {InterfaceServer} = require('interface-server');

const log = require('../logger');

const {EVENTS, SERVER} = require('../consts');
const {CustomError} = require('../errors/legacy');

const {
    APIFY_CONTAINER_PORT,
    APIFY_CONTAINER_URL,
    APIFY_DEFAULT_KEY_VALUE_STORE_ID,
} = process.env;

class Server {
    constructor(page, setup, options = {}) {
        this.hypertext = http.createServer();
        this.websocket = null;

        if (InterfaceServer) {
            this.interface = new InterfaceServer({
                ...options.interface,
                httpServer: this.hypertext,
            });

            // temporary remapping
            this.start = this.interface.start.bind(this.interface);
            this.serve = this.interface.serve.bind(this.interface);
            this.prompt = this.interface.prompt.bind(this.interface);
            page.on(EVENTS.load, async () => this.interface.serve(page));
        }
    }
}

module.exports = {
    Server,
};
