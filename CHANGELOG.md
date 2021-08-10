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

### `Robot.Setup`
- `OutputTemplate` ➜ `OutputSchema`
- `getApifyProxySession` ➜ `getProxySessionId`
- `OPTIONS` ➜ `options`
- `OPTIONS.blockRequests` ➜ `options.trafficFilter`
- `OPTIONS.blockRequests.patterns` ➜ `options.trafficFilter.patterns.url`
- `OPTIONS.blockRequests.analytics` ➜ `options.trafficFilter.patterns.host`
- `SERVER` ➜ `options.server`
- `SERVER.liveView` ➜ `options.server.interface`
- `SLACK.channel` ➜ `options.notify.channels.slack.channel`

### `Robot.Scope/Target`
- `constructor(setup, target, robot)` ➜ `constructor(context, [robot])`
  - simplify optional scope/target constructors
- `stepName = () => {}` ➜ `taskName = context => ({ stepName: context => {}, ... })`
  - steps are now optionally (recommended and will become the default) wrapped by their respective tasks in `Robot.Scope/Target` implementations to follow the structure in `Robot.Setup` more closely and provide other additional benefits through this closure, including type hints in step signatures. Updated `context` is passed to both tasks and steps at runtime.

- `context`
  - `relay` ➜ `state`
  - `INPUT` + `input` ➜ `input`
  - `OUTPUT` + `output` ➜ `output`

### `Robot.consts`
- `PUPPETEER.events` ➜ `EVENTS`

### `Robot.tools.login`
  - `selectors.loggedIn` ➜ `selectors.verify`
  - throw if none of either `predicate` or `selectors.verify` is present for login status verification

## Updates
- [Browser pool](https://github.com/apify/browser-pool) - support for all its features and browsers
- [Session pool](https://sdk.apify.com/docs/api/session-pool) - support for target-specific proxy management

### `Input`
- `browser` - select from available browsers to perform the automation
- `human` - enables optional human behavior simulation tools in context
- `notify` - enable error notifications to external channel(s - future)
- `prompt` - enable user prompt and require manual intervention before proceeding with the automation (currently must be implemented in scope/target)
- `options`
  - `debug`
    - `pwApi` - very verbose logs of the automation library (Playwright only)
    - `pwAll` - extremely verbose logs of the automation library (Playwright only)
    - `muted` - mute error notifications to external channels
    - `traffic`
      - `enable` - enable realtime traffic logs (very verbose)
      - `fullUrls` - log full URLs including complete parameters
      - `hostOnly` - only log traffic with the target host domain
      - `hideFilter` - mute traffic blocked by traffic filters in logs
  - `notify`
    - `details` - include complete error in error notification
    - `visuals` - include visual indicator of important input options
    - `verbose` - include messages from the automation library
    - `slack` - enable channel for error notifications (Slack)
  - `proxy`
    - `proximity`
      - `enable` - enable proxy selection based on geolocation approximation based on input IP
  - `server`
    - `interface`
      - `enable` - enable visual interface for live inspection of and interaction with the automation
    - `websocket`
      - `enable` - enable built-in websocket server for external real-time network communication (future)

### `Robot.CaptchaSolver`
TODO
- `solveCaptcha`
- `injectSolution`
- `getSolution`

### `Robot.Error`
Native support for custom errors with special flags reserved for use by the robot and support for `JSON.stringify` 
Non-custom native errors are wrapped automatically, though only shortly before error alert and exit of the actor.

#### Examples
Exhaust options: `throw new Robot.Error({name, type, data, error, retry, message, rotateSession, retireSession})`

Rethrow wrapped error: 
- custom error merged with the re-thrown error `throw new Robot.Error({error})`
- custom error with `cause` of re-thrown error `throw new Robot.errors.Example({error, data: {test: 'anything'}})`

Reserved properties:
- `data: Object` - container for arbitrary data properties
- `type: String` - constructor name of the custom error
- `error: Error` - optional cause of the custom error
- `retry: Boolean` - retry current run till retry limit
- `rotateSession` - rotate proxy session on retry
- `retireSession` - rotate proxy session on retry

### `Robot.Human`
Enable humanized toolset for manual and automatic simulation of human behavior. 
Enable automatic pointer tracking and visual pointer indicator in debug mode.

- `human.click` - humanized clicking with random movements and action delays
- `human.point` - humanized pointing with random movements and action delays
- `human.press` - humanized keypress with random movements and action delays
- `human.sleep` - humanized waiting with random movements and action delays
- `human.type` - humanized typing with random movements and action delays

Currently disabled by default due to unresolved interference with other actions:
- `human.startMotion` - start automated continuous simulation of human behavior
- `human.stopMotion` - stop automated continuous simulation of human behavior


### `Robot.Setup`
Documented in the base class `Robot.Setup`
- `step.abort(context)` - support centralized abort trigger across all targets
- `options.browserPool` - browser pool options with extra options and mappings
- `options.sessionPool` - session pool options with extra options for the robot
- `options.sessionPool.disable` - disable session pool
- `options.notify.details` - include extra error details in external notifications
- `options.notify.filters` - specify error alert filters based on error name/type
- `options.notify.visuals` - include visual indicator of important input options
- `options.server.interface.prompt.handlers` - handlers for interface prompt
- `options.trafficFilter.resources` - filter out requests by resource type

### `Robot.Scope`
Introduce generic scope abstraction for larger, target independent automations

### `Robot.Target`
Extends `Robot.Scope`

### `Robot.Scope/Target`
- `Robot.context`
  - `task` - task currently being processed
  - `step` - step currently being processed
  - `input` - input as defined by input schema
    - `options` - input options for various robot features transformed into an object at runtime from the flat input schema using dot notation
  - `output` - current output of the automation
  - `page` - instance of browser page (Puppeteer/Playwright)
    - `gotoDom` - utility method for navigation with `waitUntil` option enabled and set to `EVENTS.domcontentloaded`
  - `events` - future tools for emitting and listening to custom events
  - `human` - optional human behavior simulation tool to replace native methods where needed
  - `pools` - instances for utility management pools of the Apify SDK
    - `BrowserPool` - exposed browser pool instance if applicable
    - `SessionPool` - exposed session pool instance if applicable
  - `tools` - convenience automation tools preloaded with `page`
    - `matchPattern` - pattern matching utility for a single pattern
    - `iteratePatterns` - pattern matching utility for multiple patterns
  - `state` - utility relay object for passing state and data between steps and scopes
  - `server` - general purpose server for real-time network communication and visual interaction with the actor
    - [x] `interface` - visual interface for live inspection of and interaction with automation runtime
      - `start` - initialize and launch the interface server (automatic with input option enabled)
      - `serve` - capture a snapshot of current browser state and update the visual interface
      - `prompt` - prompt an automation action with visual context through the interface 
    - [ ] `hypertext` - future universal hypertext server with dynamic custom handlers
    - [ ] `websocket` - future universal websocket server with dynamic custom handlers

Properties available directly on the scope instance, outside of context:
- `this.task` - currently processed task as defined in `Robot.Setup`
  - `this.task.output` - output of current task
- `this.step` - currently processed step as defined in `Robot.Setup`
  - `this.step.output` - output of current step
  - `this.step.attachOutput(output: object)` - attach output to current step (object merge)
  - `this.step.output.attach(output: object)` - same as above
- `this.step` - current global output is available outside of the context, directly on the scope instance
- `this.will(text: string)` - trigger a visually highlighted inline step without a separate step function
- `step.will(text: string)` - same as above for generic or loose steps outside of `Robot.Scope/Target`
  - Objective
    - improve readability for long automation logs through clearly separated segments of runtime information
    - enable additional layer of segmentation where using logically separate steps isn't possible or desired
  - Features
    - [x] log a description of the following action with visual emphasis
    - [ ] fire a custom internal event with the step description (future)
    - [ ] dispatch a custom event via built-in websocket server (future)
    - [ ] support optional automatic screenshot for inline steps (future)

Bindings between children extending from this class and contents of `context` are automatically initialized through the `Robot.Scope` base class. Therefore constructor is optional if there is no need to manage properties or **local** state of the scope. The `state` object hosted by `context` is intended for sharing and managing **global** state across all scopes, steps and tasks at runtime.

### `Robot.errors`
Limited dictionary of the most common errors with support for error instance matching. Default errors that can be further modified or extended for the needs of a specific automation project.

#### Examples
- `Robot.errors.Network` - throw, print and report a generic network error
- `Robot.errors.access.Blocked` - throw, print and report a generic access error
- `Robot.errors.session.Rotate` - rotate proxy session before retrying a failed action
- `Robot.errors.Status({error, retry: true, retireSession: true, statusCode: 403})` - rethrow previous error as cause of the custom error, retire proxy session before retrying failed action and print a message with failed status code

### `Robot.tools`
Pattern matching has been updated to only match elements actually visible on the page in order to avoid false match positives with hidden elements not intended for current state of the user-facing website interface. Below mentioned tools are now also pre-initialized with the page and available in `Robot.Context` and directly on instances of `Robot.Scope/Target` class for convenience.
- `matchPattern(pattern)` - convenience shortcut preloaded with `page`
- `iteratePatterns(patterns, [patternOrder])` - convenience shortcut preloaded with `page`

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