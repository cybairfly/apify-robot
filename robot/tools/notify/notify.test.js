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
});
