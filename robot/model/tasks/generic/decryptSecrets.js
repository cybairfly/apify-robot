const Apify = require('apify');
const Robot = require('apify-robot');

module.exports = async ({ input, state }) => {
	state.username = await Robot.tools.decrypt(input.username, !Apify.Actor.isAtHome());
	state.password = await Robot.tools.decrypt(input.password, !Apify.Actor.isAtHome());
};
