// TODO move & deprecate
import {SessionPool} from 'apify';
import {BrowserPool} from 'browser-pool';
import {Page} from 'playwright';
import Human from '../human';

export interface RobotContext {
    input: {
        target: String,
        tasks: Array<string>,
        retry: Number,
        abort: Boolean,
        block: Boolean,
        debug: Boolean,
        human: Boolean,
        stream: Boolean,
        session: Boolean,
        stealth: Boolean
    },
    output: Object,
    page: Page,
    human: Human | undefined,
    pools: {
        browserPool: BrowserPool,
        sessionPool: SessionPool,
    },
    events: {
        emit: Function,
        listen: Function
    },
    server: {
        hypertext: {},
        interface: {},
        websocket: {
            send: (message: String) => String,
            cast: (message: String) => String
        },
    },
    state: Object,
    tools: Object
}