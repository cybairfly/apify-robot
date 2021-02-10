0.2.0 / 2021-02-XX
==================
## Breaking
### `Robot.Scope(Target)`
- `constructor(setup, target, robot)` ➜ `constructor(context)`
  - simplify optional scope/target constructors
- `super(setup, target)` ➜ `super(...arguments)`
  - adapt parent template class call to the above
- `stepName = () => {}` ➜ `taskName = context => ({ stepName: context => {}, ... })`
  - steps are now optionally (recommended and will become the default) wrapped by their respective tasks in `Robot.Scope/Target` implementations to follow the structure in `Robot.Setup` more closely and provide other additional benefits through this closure, including type hints in step signatures. Updated `context` is passed to both tasks and steps at runtime.

## Updates
Bindings between children classes inheriting from `Robot.Scope/Target` and contents of `context` are automatically initialized through the `Robot.Scope` base class. Therefore constructor is optional when there is no need to manage **local** state of the scope. The `relay` object hosted by `context` is intended for sharing and managing **global** state across all scopes, steps and tasks at runtime.

- `Robot.Target` extends `Robot.Scope`
  - support for generic scope class for larger target independent automations 

### `Robot.Scope(Target)`
Properties available directly on the scope instance, outside of the context:
- `this.task` - currently processed task as defined in `Robot.Setup`
  - `this.task.output` - output of current task
- `this.step` - currently processed step as defined in `Robot.Setup`
  - `this.step.output` - output of current step
  - `this.step.attachOutput(output: object)` - attach output to current step (object merge)
  - `this.step.output.attach(output: object)` - same as above
- `this.step` - current global output is available outside of the context, directly on the scope instance
- `this.will(text: string)` - trigger a virtual **inline step** without requiring a separate step function pre-defined for and shared by all targets in `Robot.Setup`
- `step.will(text: string)` - same as above for generic or loose steps without binding to `Robot.Scope/Target`
  - Objective
    - improve readability for long automation logs through clearly separated segments of runtime information
    - enable additional layer of segmentation where using logically separate steps isn't possible or desired
  - Features
    - [x] log a description of the following action with visual emphasis
    - [ ] fire a custom internal event with the step description (future)
    - [ ] dispatch a custom event via built-in websocket server (future)
    - [ ] support optional automatic screenshot for inline steps (future)

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