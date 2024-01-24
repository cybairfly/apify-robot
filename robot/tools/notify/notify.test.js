const { formatMessage } = require('./index');
const { RobotError } = require('../../errors');

describe('formatMessage', () => {
	beforeEach(() => {
		process.env.APIFY_ACTOR_RUN_ID = 123;
	});
	test('messages match expected format', () => {
		const error = new RobotError({message: 'generic error message'});
		const input = { target: 'hulu', debug: true, session: null, stealth: true };
		const options = {notify: {details: true, verbose: true}};
		expect(formatMessage({input, error, options })).toMatchSnapshot();
	});

	test('notifications exclude noisy messages from Playwright/Puppeteer', () => {
		const error = new RobotError({message: `\n  page.goto: NS_ERROR_PROXY_BAD_GATEWAY\n=========================== logs ===========================\nnavigating to "https://auth.hulu.com/web/login", waiting until "load"\n============================================================\nNote: use DEBUG=pw:api environment variable to capture Playwright logs.\n`});
		const input = { target: 'hulu', debug: true, session: null, stealth: true };
		const options = {notify: {details: true, verbose: false}};
		expect(formatMessage({input, error, options })).toMatchSnapshot();
	});

	test('verbose mode works for Playwright', () => {
		const error = new RobotError({message: `\n  page.goto: NS_ERROR_PROXY_BAD_GATEWAY\n=========================== logs ===========================\nnavigating to "https://auth.hulu.com/web/login", waiting until "load"\n============================================================\nNote: use DEBUG=pw:api environment variable to capture Playwright logs.\n`});
		const input = { target: 'hulu', debug: true, session: null, stealth: true };
		const options = {notify: {details: true, verbose: true}};
		expect(formatMessage({input, error, options })).toMatchSnapshot();
	});
});
