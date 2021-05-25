const { formatMessage } = require('./');
const { RobotError } = require('../../errors');


describe('formatMessage', () => {
  beforeEach(() => {
    process.env.APIFY_ACTOR_RUN_ID = 123;
  })
  test('messages match expected format', () => {
    const error = new RobotError('generic error message'); 
    const errorDetails = JSON.stringify(error, null, 4);
    const input = { target: 'hulu', debug: true, session: null, stealth: true }
    expect(formatMessage({input, error, errorLabel: error.type || error.name, errorDetails })).toMatchSnapshot();
  })
});
