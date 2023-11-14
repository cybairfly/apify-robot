const got = require('got');
const tunnel = require('tunnel');
const Robot = require('apify-robot');

const {TIMEOUTS} = Robot.consts;
const {URLS} = require('./consts');
const {outputs} = require('../../robot');

/**
 * @param {import('apify-robot').RobotContext} context
 * @param {import('apify-robot').Robot} robot
 */
module.exports = async (context, {proxyIp, proxyConfig}) => {
    // ...
};
