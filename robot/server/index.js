const Apify = require('apify');
const http = require('http');
const fs = require('fs');
const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const {promisify} = require('util');
const {InterfaceServer} = require('interface-server');

const writeFile = promisify(fs.writeFile);
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
        this.interface = new InterfaceServer(options);
        this.hypertext = null;
        this.websocket = null;

        // temporary remapping
        this.start = this.interface.start.bind(this.interface);
        this.serve = this.interface.serve.bind(this.interface);
        this.prompt = this.interface.prompt.bind(this.interface);
        page.on(EVENTS.load, async () => this.interface.serve(page));
    }
}

module.exports = {
    Server,
};
