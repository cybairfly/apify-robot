const Apify = require('apify');
const Robot = require('apify-robot');
const setup = require('./robot');

// where to look for project root
const route = __dirname;

Apify.Actor.main(async () => {
	const input = (await Apify.Actor.getValue('INPUT')) || require('./INPUT');
	const OUTPUT = await Robot.route(route).check(input).build(setup).start();
});
