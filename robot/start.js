/**
 * Copyright © Vasek Tobey Vlcek <cyberfly@email.cz> - All Rights Reserved.
 * Unauthorized copying of this software repository is strictly prohibited.
 * Proprietary and confidential software.
 */

/* eslint-disable global-require */

const debug = require('debug');
const Apify = require('apify');
const Setup = require('./setup');

const route = __dirname;

Apify.Actor.main(async () => {
    const input = (await Apify.Actor.getValue('INPUT')) || require('./INPUT');

    if (input['options.debug.pwApi'])
        debug.enable('pw:api*');

    if (input['options.debug.pwAll'])
        debug.enable('pw:protocol*');

    const Robot = require('apify-robot');
    const setup = new Setup();

    const OUTPUT = await Robot.route(route).check(input).build(setup).start();
});
