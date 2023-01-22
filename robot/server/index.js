const Apify = require('apify');
const http = require('http');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util');
const {InterfaceServer} = require('interface-server');

const log = require('../logger/index.js');

const {EVENTS, SERVER} = require('../consts');
const {CustomError} = require('../errors/legacy');

const {
    APIFY_CONTAINER_PORT,
    APIFY_CONTAINER_URL,
    APIFY_DEFAULT_KEY_VALUE_STORE_ID,
} = process.env;

class Server {
    /**
     * Custom built-in server for automated internal use and custom manual interactions with remote counterparts from within the automations
     * @param {Object} page
     * @param {types.setup} setup
     * @param {types.options} options
     */
    constructor(page, setup, options = {}) {
        this.hypertext = http.createServer();
        this.websocket = null;
        this.options = options.server;

        if (InterfaceServer) {
            const clientOptions = options.server.interface.client;
            if (clientOptions.route)
                clientOptions.route = path.join(setup._rootPath, clientOptions.route);

            this.interface = new InterfaceServer({
                ...options.server.interface,
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
