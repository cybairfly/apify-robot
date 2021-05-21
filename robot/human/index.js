const Apify = require('apify');
const log = require('../logger');

const {sleep} = Apify.utils;

class Human {
    #page;

    #motion

    constructor(page, options) {
        this.#page = page;
        this.type = this.#sleepify(this.type);
        this.click = this.#sleepify(this.click);

        if (this.#page)
            this.startMotion();
    }

    type = async (selector, text, options) => {
        const characters = text.split('');

        for (const character of characters)
            await this.#page.type(selector, character, {...options, delay: Math.random() * 250});
    };

    click = async (selector, options) => {
        return this.#page.click(selector, {
            // position: {},
            delay: Math.random() * 500,
        });
    }

    point = async (x, y) => this.#page.mouse.move(x || Math.round(Math.random() * 800), y || Math.round(Math.random() * 800));

    sleep = async (limit = 3) => limit > 100 ?
        sleep(Math.random() * limit) :
        sleep(Math.random() * limit * 1000);

    #sleepify = action => async (...args) => {
        await this.point();
        await this.sleep();
        await this.point();
        await action(...args);
    }

    startMotion = async () => {
        const interval = 1000;
        this.#motion = setInterval(async () => {
            await this.sleep(interval);
            if (Math.round(Math.random()) % 2) {
                this.point().catch(() => {});
            }
        }, interval);
    }

    stopMotion = async () => {
        clearInterval(this.#motion);
    }
}

module.exports = Human;
