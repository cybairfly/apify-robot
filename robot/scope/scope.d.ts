import {SessionPool} from 'apify';
import {BrowserPool} from 'browser-pool';
import {Page} from 'playwright';

export interface RobotContext {
    input: {
        target: String,
        tasks: Array<string>,
        retry: Number,
        abort: Boolean,
        block: Boolean,
        debug: Boolean,
        stream: Boolean,
        session: Boolean,
        stealth: Boolean
    },
    output: Object,
    page: Page,
    pools: {
        browserPool: BrowserPool,
        sessionPool: SessionPool,
    },
    events: {
        emit: Function,
        listen: Function
    },
    server: {
        http: {},
        livecast: {},
        websocket: {
            send: (message: String) => String,
            cast: (message: String) => String
        },
    },
    state: Object,
    tools: Object
}
