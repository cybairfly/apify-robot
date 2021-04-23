export interface input {
    target: string,
    tasks: Array<string>,
    browser: string,
    retry: number,
    abort: boolean,
    block: boolean,
    debug: boolean,
    notify: boolean,
    silent: boolean,
    server: boolean,
    session: boolean,
    stealth: boolean
}

export interface setup {
    server: {
        livecast: {
            events: Object
        },
        websocket: {
            events: Object,
        },
    },
}

export interface options {
    debug: {
        fullUrls: boolean,
        hostOnly: boolean,
        hideFilter: boolean,
    },
    notify: {
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
