const Apify = require('apify');
const log = require('../logger');
const {trackPointer} = require('./tools');

const {sleep} = Apify.utils;

class Human {
	#page;

	#motion;

	constructor(page, options) {
		this.#page = page;
		this.type = this.#humanize(this.type);
		this.click = this.#humanize(this.click);
		this.point = this.#sleepify(this.point);
		this.press = this.#sleepify(this.press);

		if (!Apify.Actor.isAtHome() && options.debug)
			trackPointer(page);

		// TODO wrapper to pause motion before actions
		// if (this.#page)
		//     this.startMotion();
	}

	type = async (selector, text, options) => {
		const characters = text.split('');
		for (const character of characters)
			await this.#page.type(selector, character, {...options, delay: Math.random() * 250});
	};

	click = async (selector, options) => this.#page.click(selector, {
		...options,
		// position: {},
		delay: Math.random() * 500,
	});

	point = async (x, y) => this.#page.mouse.move(x || Math.round(Math.random() * 800), y || Math.round(Math.random() * 800)).catch(error => null);

	press = async (key, options) => this.#page.keyboard.press(key, {...options, delay: Math.random() * 500});

	sleep = async (limit = 3) => limit > 100 ?
		sleep(Math.random() * limit) :
		sleep(Math.random() * limit * 1000 + 1000);

	#humanize = action => async (...args) => {
		do await this.point(); while (Math.random() < 0.5);
		await action(...args);
	};

	#sleepify = action => async (...args) => {
		await this.sleep();
		await action(...args);
	};

	startMotion = async () => {
		const interval = Math.random() * 1000 + 1000;
		this.#motion = setInterval(async () => {
			await this.sleep(interval);
			if (Math.round(Math.random()) % 2)
				this.point().catch(() => {});
		}, interval);
	};

	stopMotion = async () => {
		clearInterval(this.#motion);
	};
}

module.exports = Human;
