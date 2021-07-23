import {SessionPool} from 'apify';
import {BrowserPool} from 'browser-pool';
import {Page} from 'playwright';
import Human from './human';
import {iteratePatterns, matchPattern} from './public/tools/types.d';

export {iteratePatterns, matchPattern};

export interface Robot {
    input: input,
    options: options,
    location: {
        city: string,
        country: string,
        countryCode: string
    } | null
}

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
        http: {},
        livecast: {},
        websocket: {
            send: (message: String) => String,
            cast: (message: String) => String
        },
    },
    state: Object,
    tools: {
        matchPattern: matchPattern,
        iteratePatterns: iteratePatterns
    }
}

export interface input {
    target: string,
    tasks: Array<string>,
    browser: string,
    ipAddress: string,
    retry: number,
    abort: boolean,
    block: boolean,
    debug: boolean,
    human: boolean,
    notify: boolean,
    silent: boolean,
    server: boolean,
    session: boolean,
    stealth: boolean
}

export interface options {
    debug: {
        muted: boolean,
        traffic: {
            enable: boolean,
            fullUrls: boolean,
            hostOnly: boolean,
            hideFilter: boolean,
        }
    },
    notify: {
        details: boolean,
        slack: boolean,
    },
    proxy: {
        proximity: {
            enable: boolean,
            locationProviderId: string
        }
    },
    server: {
        livecast: {
            enable: boolean
        },
        websocket: {
            enable: boolean
        }
    }
}
