interface RobotErrorOptions {
    name?: string,
    type?: string,
    error?: Error,
    retry?: boolean,
    message?: string,
    rotateSession?: boolean,
    retireSession?: boolean
}

export {
    RobotErrorOptions,
};
