interface RobotErrorOptions {
    name?: string,
    type?: string,
    data: Object,
    error?: Error,
    retry?: boolean,
    message?: string,
    rotateSession?: boolean,
    retireSession?: boolean
}

export {
    RobotErrorOptions,
};
