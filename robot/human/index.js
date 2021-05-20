const Apify = require('apify');
const log = require('../logger');

const {sleep} = Apify.utils;

class Human {
    #page;

    constructor(page, options) {
        this.#page = page;
        this.type = this.#sleepify(this.type);
        this.click = this.#sleepify(this.click);
    }

    type = async (selector, text, options) => {
        const characters = text.split('');

        for (const character of characters)
            await this.#page.type(selector, character, {...options, delay: Math.random() * 250});
    };

    click = async (selector, options) => {
        await this.#page.mouse.move(Math.round(Math.random() * 800), Math.round(Math.random() * 600));
        return this.#page.click(selector, {
            // position: {},
            delay: Math.random() * 500,
        });
    }

    sleep = async (limit = 3) => limit > 999 ?
        sleep(Math.random() * limit) :
        sleep(Math.random() * limit * 1000);

    #sleepify = action => async (...args) => {
        await this.sleep();
        await action(...args);
        await this.sleep();
    }
}

module.exports = Human;
