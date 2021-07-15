0.2.0 / 2021-05-XX
==================
## Overview
Internals are currently backward compatible to enable a smooth transition from older versions, the upgrade will however require at least an update of a project's `Robot.Setup` and any tools updated in the "breaking" section. Ideally, input schema and API of the implementations should also be updated. Legacy functionality and backward compatibility will be completely removed in upcoming versions in the future.

## Breaking
### *Environment*
`process.env.slackToken` ➜ `process.env.SLACK_TOKEN`

### Input
- `retry` - retry will now trigger only on custom errors with the retry flag set to `true`
- `silent` - removed in favor of replacement options below (`notify`, `options.debug.muted`)

### `Robot`
Renamed variables for more clarity, merged actor and robot input and output. Input for the robot is no longer clearly separated from actor input and instead merged and flattened with the rest of input due to input schema constraints and considerations. Workaround for this if it should ever become an issue is pre-processing of the input before passing it to the robot for processing and accessing nested properties during automation as pre-defined. This change also rules out the potential for processing multiple inputs within a single run without the need for a higher order management actor but since the use case is unlikely and would introduce significant overhead with less clarity in terms of managing and matching inputs and outputs, drawbacks seem to far outweight the potential benefits and thus this kind of usage will not be supported in the future.
  - `INPUT` + `input` ➜ `input`
  - `OUTPUT` + `output` ➜ `output`

### `Robot.consts`
- `PUPPETEER.events` ➜ `EVENTS`

### `Robot.Setup`
- `OutputTemplate` ➜ `OutputSchema`
- `OPTIONS` ➜ `options`
- `OPTIONS.blockRequests` ➜ `options.trafficFilter`
- `OPTIONS.blockRequests.patterns` ➜ `options.trafficFilter.patterns.url`
- `OPTIONS.blockRequests.analytics` ➜ `options.trafficFilter.patterns.host`
- `SERVER` ➜ `options.server`
- `SERVER.liveView` ➜ `options.server.livecast`
- `SLACK.channel` ➜ `options.notify.channels.slack.channel`

### `Robot.Scope/Target`
- `constructor(setup, target, robot)` ➜ `constructor(context)`
  - simplify optional scope/target constructors
- `super(setup, target)` ➜ `super(...arguments)`
  - adapt parent template class call to the above
- `stepName = () => {}` ➜ `taskName = context => ({ stepName: context => {}, ... })`
  - steps are now optionally (recommended and will become the default) wrapped by their respective tasks in `Robot.Scope/Target` implementations to follow the structure in `Robot.Setup` more closely and provide other additional benefits through this closure, including type hints in step signatures. Updated `context` is passed to both tasks and steps at runtime.

- `context`
  - `relay` ➜ `state`
  - `INPUT` + `input` ➜ `input`
  - `OUTPUT` + `output` ➜ `output`

### `Robot.tools.login`
  - `selectors.loggedIn` ➜ `selectors.verify`
  - throw if none of either `predicate` or `selectors.verify` is present for login status verification

## Updates
- [Browser pool](https://github.com/apify/browser-pool) - support for all its features and browsers
- [Session pool](https://sdk.apify.com/docs/api/session-pool) - support for target-specific proxy management

### `Input`
- `browser` - select from available browsers to perform the automation
- `human` - enables optional human behavior simulation tools in context
- `notify` - enable error notifications to external channel(s, future)
- `prompt` - enable user prompt and require manual intervention before proceeding with the automation (currently must be implemented in scope/target)
- `options.debug.traffic.fullUrls` - log full URLs including complete parameters
- `options.debug.traffic.hostOnly` - only log traffic with the target host domain
- `options.debug.traffic.hideFilter` - hide traffic blocked by filter in the logs
- `options.debug.muted` - mute error notifications to external channels
- `options.notify.details` - include complete error in error notification
- `options.notify.slack` - enable channel for error notifications (Slack)
- `options.server.livecast.enable` - enable live visual stream of actions
- `options.server.websocket.enable` - enable real-time communication server

### `Robot.Error`
Native support for custom errors with special flags reserved for use by the robot and support for `JSON.stringify` 
Non-custom native errors are wrapped automatically, though only shortly before error alert and exit of the actor.

#### Usage examples
Exhaust options `throw new Robot.Error({name, type, data, error, retry, message})`

Rethrow wrapped error: 
- custom error merged with the re-thrown error `throw new Robot.Error({error})`
- custom error with `cause` of re-thrown error `throw new Robot.errors.Example({error})`

Reserved properties:
- `data: Object` - container for arbitrary data properties
- `type: String` - constructor name of the custom error
- `cause: Error` - optional cause of the custom error
- `retry: Boolean` - retry current run till retry limit

### `Robot.Human`
Initialize page with human behavior options on demand - to be extended with more functionality.

### `Robot.Setup`
- `step.abort(context)` - support centralized abort trigger across all targets
- `options.browserPool` - browser pool options with extra options and mappings
- `options.sessionPool` - session pool options
- `options.notify.details` - support extra error details in external notifications
- `options.notify.filters` - support error alert filters based on error name/type
- `options.trafficFilter.resources` - filter out requests by resource type

### `Robot.Scope`
Adding support for generic scope class for larger target independent automations

### `Robot.Target`
Extends `Robot.Scope`

### `Robot.Scope/Target`
- `context`
  - `input.options` - input options for various robot features transformed into an object at runtime from the flat input schema using dot notation
  - `page.gotoDom` - utility method for navigation with `waitUntil` option enabled and set to `EVENTS.domcontentloaded`
  - `human` - optional human behavior simulation tool to replace native methods where needed (must be enabled on input)
      - `human.type`
      - `human.click`
      - `human.sleep`
  - `pools` 
    - `BrowserPool` - exposed browser pool instance if applicable
    - `SessionPool` - exposed session pool instance if applicable

Properties available directly on the scope instance, outside of context:
- `this.task` - currently processed task as defined in `Robot.Setup`
  - `this.task.output` - output of current task
- `this.step` - currently processed step as defined in `Robot.Setup`
  - `this.step.output` - output of current step
  - `this.step.attachOutput(output: object)` - attach output to current step (object merge)
  - `this.step.output.attach(output: object)` - same as above
- `this.step` - current global output is available outside of the context, directly on the scope instance
- `this.will(text: string)` - trigger a virtual **inline step** without requiring a pre-defined step function
- `step.will(text: string)` - same as above for generic or loose steps without binding to `Robot.Scope/Target`
  - Objective
    - improve readability for long automation logs through clearly separated segments of runtime information
    - enable additional layer of segmentation where using logically separate steps isn't possible or desired
  - Features
    - [x] log a description of the following action with visual emphasis
    - [ ] fire a custom internal event with the step description (future)
    - [ ] dispatch a custom event via built-in websocket server (future)
    - [ ] support optional automatic screenshot for inline steps (future)

Bindings between children extending from this class and contents of `context` are automatically initialized through the `Robot.Scope` base class. Therefore constructor is optional if there is no need to manage properties or **local** state of the scope. The `state` object hosted by `context` is intended for sharing and managing **global** state across all scopes, steps and tasks at runtime.

0.1.0 / 2021-01-14
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

0.0.17 / 2020-12-31
===================

x.y.z / yyyy-mm-dd
==================
## Overview
## Breaking
## Updates