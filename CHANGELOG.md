0.1.18 / 2021-01-13
===================
## Breaking
### `INPUT`
- `debug` - enable debug mode but no longer silence error alerts
- `silent` - enable silent mode (mute external notifications)

### `Robot.tools`
- `verifyResult(selector, contents)` ➜ `verifyResult({selector, contents})`
  - accept a single argument instead of separate arguments to be compatible with Playwright API

- `searchPolicyNumber` ➜ `searchResult` 
  - generalize the utility for generic use cases

## Updates
### `INPUT`
- `debug` + `retry` - debug mode will save debug buffers to store on each retry

0.1.17 / 2020-12-31
===================
## Overview
## Breaking
## Updates