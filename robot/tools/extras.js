const decorators = {
    log: id => contextArgs => async originalArgs => {
        let [message] = originalArgs;
        originalArgs[0] = `${id} ${message}`;

        return originalArgs;
    },
    page: contextArgs => async originalArgs => {
        const {methodName} = contextArgs;
        const argsForLog = originalArgs => originalArgs.map(arg => typeof arg === 'function' ? arg.toString().replace(/\s+/g, ' ') : arg);
        console.log({[methodName]: argsForLog(originalArgs)});
    }
};

module.exports = {
    decorators
};
