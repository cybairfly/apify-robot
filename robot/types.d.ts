export interface Robot {
    input: input,
    options: options,
    location: {
        city: string,
        country: string,
        countryCode: string
    } | null
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
        fullUrls: boolean,
        hostOnly: boolean,
        hideFilter: boolean,
        muteErrors: boolean
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
