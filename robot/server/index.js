const Apify = require('apify');
const http = require('http');
const fs = require('fs');
const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');

const {promisify} = require('util');

const {LiveViewServer} = Apify;
// const {log} = Apify.utils;

const writeFile = promisify(fs.writeFile);

const Snapshot = require('./snapshot');
const log = require('../logger');

const {
    CustomError,
} = require('../errors');

const {
    APIFY_CONTAINER_PORT,
    APIFY_CONTAINER_URL,
    APIFY_DEFAULT_KEY_VALUE_STORE_ID,
} = process.env;

class Server extends LiveViewServer {
    constructor(page, setup, options = {}) {
        super(options);
        this.options = options;
        this.useScreenshots = options.useScreenshots || false;
        this.log = log.child({prefix: 'LiveViewServer'});
        this._resolveMessagePromise = null;

        const {events} = setup.options.server.liveView;
        this.promptHandlers = {
            [events.abort]: () => {
                throw CustomError({
                    data: {
                        abortActor: true,
                    },
                });
            },
            [events.cancel]: () => {
                throw CustomError({
                    data: {
                        abortPayment: true,
                    },
                });
            },
            [events.confirm]: () => {
                log.info('Payment confirmed');
            },
        };
    }

    get resolveMessagePromise() {
        return this._resolveMessagePromise;
    }

    set resolveMessagePromise(resolve) {
        return this._resolveMessagePromise = resolve;
    }

    send = async (message, data) => {
        console.log({message, data});
        this.socketio.emit(message, data);
    };

    prompt = async (options = {}) => {
        if (options.action) {
            const response = await new Promise(async (resolve, reject) => {
                this.resolveMessagePromise = resolve;
                await this.send('prompt', {showPrompt: true});
                this.log.info('Waiting for frontend prompt response');
            });

            this.promptHandlers[response.action]();
        }
    };

    async serve(page) {
        try {
            await super.serve(page);
        } catch (error) {
            // console.log(error);
            log.warning('Failed to serve snapshot');
        }
    }

    async _makeSnapshot(page) {
        const pageUrl = page.url();
        this.log.info('Making live view snapshot.', {pageUrl});

        if (this.useScreenshots) {
            const [htmlContent, screenshot] = await Promise.all([
                page.content(),
                page.screenshot({
                    type: 'jpeg',
                    quality: 50,
                }),
            ]);

            const screenshotIndex = this.lastScreenshotIndex++;

            await writeFile(this._getScreenshotPath(screenshotIndex), screenshot);
            if (screenshotIndex > this.maxScreenshotFiles - 1)
                this._deleteScreenshot(screenshotIndex - this.maxScreenshotFiles);

            const snapshot = new Snapshot({pageUrl, htmlContent, screenshotIndex});
            this.lastSnapshot = snapshot;
            return snapshot;
        }
        const htmlContent = await page.content();
        const snapshot = new Snapshot({pageUrl, htmlContent});
        this.lastSnapshot = snapshot;
        return snapshot;
    }

    _setupHttpServer() {
        const containerPort = process.env.CONTAINER_PORT || 4321;

        this.port = parseInt(containerPort, 10);
        if (!(this.port >= 0 && this.port <= 65535)) {
            throw new Error('Cannot start LiveViewServer - invalid port specified by the '
                + `${'CONTAINER_PORT'} environment variable (was "${containerPort}").`);
        }
        this.liveViewUrl = process.env.APIFY_CONTAINER_URL || `http://localhost:${containerPort}`;

        this.httpServer = http.createServer();
        const app = express();

        app.use('/', express.static(__dirname));

        // Serves JPEG with the last screenshot
        app.get('/screenshot/:index', (req, res) => {
            const screenshotIndex = req.params.index;
            const filePath = this._getScreenshotPath(screenshotIndex);
            res.sendFile(filePath);
        });

        app.all('*', (req, res) => {
            res.status(404).send('Nothing here');
        });

        this.httpServer.on('request', app);

        // Socket.io server used to send snapshots to client
        this.socketio = socketio(this.httpServer);
        this.socketio.on('connection', this._socketConnectionHandler.bind(this));
    }

    _socketConnectionHandler(socket) {
        this.clientCount++;
        this.log.info('Live view client connected', {clientId: socket.id});
        socket.on('disconnect', reason => {
            this.clientCount--;
            this.log.info('Live view client disconnected', {clientId: socket.id, reason});
        });
        socket.on('answerPrompt', data => {
            this.log.debug('answerPrompt', data);

            try {
                data = JSON.parse(data);
            } catch (error) {
                this.log.debug('Failed to parse incoming message data', data);
            }

            this._resolveMessagePromise(data);
        });
        socket.on('getLastSnapshot', () => {
            if (this.lastSnapshot) {
                this.log.debug('Sending live view snapshot', {
                    createdAt: this.lastSnapshot.createdAt,
                    pageUrl: this.lastSnapshot.pageUrl,
                });

                this.socketio.emit('prompt', {showPrompt: !!this._resolveMessagePromise});
                this.socketio.emit('snapshot', this.lastSnapshot);
            }
        });
    }
}

module.exports = {
    Server,
};
