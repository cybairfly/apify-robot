0.1.17 / 2021-01-31
===================
## Breaking
### `Robot.Scope(Target)`
(Constructor is optional - not required)
- `constructor(setup, target, robot)` ➜ `constructor(context)`
  - simplify optional scope/target constructors
- `super(setup, target)` ➜ `super(...arguments)`
  - adapt parent template class call to the above

## Updates
- `Robot.Target` extends `Robot.Scope`
  - support for generic scope class for larger target independent automations 

### `Robot.Scope(Target)`
Properties available directly on the scope instance, outside of the context:
- `this.task` currently processed task as defined in `Robot.Setup`
  - `this.task.output` - output of current task
- `this.step` currently processed step as defined in `Robot.Setup`
  - `this.step.output` - output of current step
  - `this.step.attachOutput(output: object)` - attach output to current step (object merge)
  - `this.step.output.attach(output: object)` - same as above
- `this.step` current global output is available outside of the context, directly on the scope instance
- `this.will(text: string)` - trigger a virtual **inline step** without requiring a separate step function pre-defined for and shared by all targets in `Robot.Setup`
- `step.will(text: string)` - same as above for generic or loose steps without class binding
  - Objective
    - improve readability for long automation logs through clearly separated segments of runtime information
    - enable additional layer of segmentation where using logically separate steps isn't possible or desired
  - Features
    - [x] log a description of the following action with visual emphasis
    - [ ] support optional automatic screenshot for inline steps (future)
    - [ ] fire a custom event with the step description (future)

0.1.18 / 2021-01-05
===================
## Breaking
### `Robot.tools`
- `verifyResult(selector, contents)` ➜ `verifyResult({selector, contents})`
  - accept a single argument instead of separate arguments to be compatible with Playwright API

- `searchPolicyNumber` ➜ `searchResult` 
  - generalize the utility for other use cases

x.y.z / yyyy-mm-dd
==================
## Overview
## Breaking
## Updates