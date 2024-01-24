const attachFingerprint = async (fingerprint, page) => {
    await page.addInitScript((fp) => {
        const { batteryInfo, navigator: newNav, screen: newScreen, webGl, historyLength } = fp;

        const overrideStaticObject = (targetObj, objectToSet) => {
            Object.keys(objectToSet).forEach((key) => {
                console.log(key, 'KEY');
                Object.defineProperty(targetObj, key, {
                    get: () => objectToSet[key],
                });
            });
        };

        function overrideFunction(obj, functionName, newFunction) {
            const oldFunction = obj[functionName];

            newFunction.toString = () => 'function createElement() { [native code] }';

            obj[functionName] = newFunction.bind(obj);

            const oldCall = Function.prototype.call;

            function call() {
                return oldCall.apply(this, arguments); //eslint-disable-line
            }

            // eslint-disable-next-line
            Function.prototype.call = call;

            const nativeToStringFunctionString = Error.toString().replace(
                /Error/g,
                'toString',
            );
            const oldToString = Function.prototype.toString;

            function functionToString() {
                if (this === window.document.createElement) {
                    return 'function createElement() { [native code] }';
                }
                if (this === functionToString) {
                    return nativeToStringFunctionString;
                }
                return oldCall.call(oldToString, this);
            }

            // eslint-disable-next-line
            Function.prototype.toString = functionToString
        }

        // try to override WebGl
        try {
            // Remove traces of our Proxy
            const stripErrorStack = (stack) => stack
                .split('\n')
                .filter((line) => !line.includes('at Object.apply'))
                .filter((line) => !line.includes('at Object.get'))
                .join('\n');

            const getParameterProxyHandler = {
                get(target, key) {
                    try {
                        // Mitigate Chromium bug (#130)
                        if (typeof target[key] === 'function') {
                            return target[key].bind(target);
                        }
                        return Reflect.get(target, key);
                    } catch (err) {
                        err.stack = stripErrorStack(err.stack);
                        throw err;
                    }
                },
                apply(target, thisArg, args) {
                    const param = (args || [])[0];
                    // UNMASKED_VENDOR_WEBGL
                    if (param === 37445) {
                        return webGl.vendor;
                    }
                    // UNMASKED_RENDERER_WEBGL
                    if (param === 37446) {
                        return webGl.renderer;
                    }
                    try {
                        return Reflect.apply(target, thisArg, args);
                    } catch (err) {
                        err.stack = stripErrorStack(err.stack);
                        throw err;
                    }
                },
            };

            const proxy = new Proxy(
                WebGLRenderingContext.prototype.getParameter,
                getParameterProxyHandler,
            );

            Object.defineProperty(WebGLRenderingContext.prototype, 'getParameter', {
                configurable: true,
                enumerable: false,
                writable: false,
                value: proxy,
            });
        } catch (err) {
            console.warn(err);
        }

        // override navigator
        overrideStaticObject(window.navigator, newNav);

        // override screen
        overrideStaticObject(window.screen, newScreen);
        overrideStaticObject(window.screen, newScreen);
        overrideStaticObject(window.history, { length: historyLength });
        overrideFunction(navigator, 'getBattery', async () => batteryInfo);
        // override batteryInfo
    }, fingerprint);
};

module.exports = {
    attachFingerprint,
};
