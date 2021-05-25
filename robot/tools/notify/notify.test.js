const { formatMessage } = require('./');
const { RobotError } = require('../../errors');


describe('formatMessage', () => {
  beforeEach(() => {
    process.env.APIFY_ACTOR_RUN_ID = 123;
  })
  test('messages match expected format', () => {
    const error = new RobotError('generic error message'); 
    const input = { target: 'hulu', debug: true, session: null, stealth: true }
    expect(formatMessage({input, error })).toMatchSnapshot();
  })

  test('notifications exclude noisy messages from Playwright/Puppeteer', () => {
    const error = new RobotError(`
      page.goto: NS_ERROR_PROXY_BAD_GATEWAY\n=========================== logs ===========================\nnavigating to \"https://auth.hulu.com/web/login\", waiting until \"load\"\n============================================================\nNote: use DEBUG=pw:api environment variable to capture Playwright logs.
    `);
    const input = { target: 'hulu', debug: true, session: null, stealth: true }
    expect(formatMessage({input, error })).toMatchSnapshot();
  })
});
