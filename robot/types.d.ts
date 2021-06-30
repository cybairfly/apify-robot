export interface input {
    target: string,
    tasks: Array<string>,
    browser: string,
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
    server: {
        livecast: {
            enable: boolean
        },
        websocket: {
            enable: boolean
        }
    }
}
