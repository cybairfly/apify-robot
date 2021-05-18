interface RobotErrorOptions {
    name?: string,
    type?: string,
    error?: Error,
    retry?: boolean,
    message?: string,
    retireSession?: boolean
}

export {
    RobotErrorOptions,
};
