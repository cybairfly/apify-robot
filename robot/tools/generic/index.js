const decorators = {
    log: id => contextArgs => async originalArgs => {
        const [message] = originalArgs;
        originalArgs[0] = `${id} ${message}`;

        return originalArgs;
    },
    page: contextArgs => async originalArgs => {
        const {methodName} = contextArgs;
        const argsForLog = originalArgs => originalArgs.map(arg => typeof arg === 'function' ? arg.toString().replace(/\s+/g, ' ') : arg);
        console.log({[methodName]: argsForLog(originalArgs)});
    },
};

const decorate = (instance, methods, decorator) => {
    methods.map(methodName => {
        const originalMethod = instance[methodName];

        if (originalMethod.constructor.name === 'Function') {
            instance[methodName] = (...originalArgs) => {
                const contextArgs = {methodName};
                originalArgs = decorator(contextArgs)(originalArgs) || originalArgs;
                return originalMethod.apply(instance, originalArgs);
            };
        } else if (originalMethod.constructor.name === 'AsyncFunction') {
            instance[methodName] = async (...originalArgs) => {
                const contextArgs = {methodName};
                originalArgs = await decorator(contextArgs)(originalArgs) || originalArgs;
                return await originalMethod.apply(instance, originalArgs);
            };
        }
    });

    return instance;
};

const deepTransform = (object, transformer, ...args) => {
    Object.keys(object).forEach(key => {
        transformer(object, key, ...args);

        if (object[key] && typeof object[key] === 'object')
            return deepTransform(object[key], transformer, ...args);
    });

    return object;
};

const redactor = (object, key, redactKeys) => {
    if (redactKeys.some(redactKey => key === redactKey))
        object[key] = '<redacted>';
};

const redactObject = (object, transformer = redactor, redactKeys = ['proxyUrl', 'proxyUrls']) =>
    deepTransform(object, transformer, redactKeys);

module.exports = {
    decorators,
    decorate,
    deepTransform,
    redactObject,
};
