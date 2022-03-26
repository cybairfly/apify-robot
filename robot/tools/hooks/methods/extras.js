const {EVENTS} = require('../../../consts');

const extras = {
    gotoDom: instance => {
        instance.gotoDom = async (url, options = {}) => instance.goto(url, {
            waitUntil: EVENTS.domcontentloaded,
            ...options,
        });

        return instance;
    },
    typeHuman: instance => {
        instance.typeHuman = async (selector, text, options) => {
            const characters = text.split('');

            for (const character of characters)
                await instance.type(selector, character, {...options, delay: Math.random() * 100});
        };
    },
};

module.exports = {
    extras,
};
