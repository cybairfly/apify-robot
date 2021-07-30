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

const getInnerText = node => node.innerText;

const redactor = (object, key, redactKeys) => {
    if (redactKeys.some(redactKey => key === redactKey))
        object[key] = '<redacted>';
};

const redactObject = (object, transformer = redactor, redactKeys = ['proxyUrl', 'proxyUrls']) =>
    deepTransform(object, transformer, redactKeys);

const trimUrl = url => url.startsWith('data:') ? url.substring(0, url.indexOf(';')) : urlParamsToEllipsis(url);

const urlParamsToEllipsis = url => {
    const urlCutOffIndex = url.indexOf('?') + 1;
    return urlCutOffIndex ? `${url.slice(0, urlCutOffIndex)}...` : url;
};

/**
 * Create a centered and optionally uppercased header padded equally on both sides with a custom padder string
 * @param {{
 * string: string,
 * padder: string,
 * length: number,
 * upper: boolean
* }}} options
* @returns {string}
*/
const centerHeader = ({string = 'header', padder = '-', length = 100, upper = true}) =>
    ` ${upper ? string.toUpperCase() : string} `.padEnd((length / 2) + (string.length / 2), padder.right || padder).padStart(length, padder.left || padder);

module.exports = {
    decorators,
    decorate,
    centerHeader,
    deepTransform,
    getInnerText,
    redactObject,
    urlParamsToEllipsis,
    trimUrl,
};
