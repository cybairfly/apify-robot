interface RobotErrorOptions {
    name?: string,
    type?: string,
    retry?: boolean,
    message?: string
}

interface StatusErrorOptions {
    statusCode: number
}

export {
    RobotErrorOptions,
    StatusErrorOptions,
};
