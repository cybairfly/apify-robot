0.1.17 / 2021-01-31
===================
## Breaking
#### `Robot.Scope/Target`
(Constructor is optional - not required)
- `constructor(setup, target, robot)` ➜ `constructor(context)`
- `super(setup, target)` ➜ `super(...arguments)`

## Updates
- `Robot.Target` extends `Robot.Scope`

#### `Robot.Scope/Target`
Properties available directly on the scope instance, outside of the context:
- `this.task` currently processed task as defined in `Robot.Setup`
  - `this.task.output` - output of current task
- `this.step` currently processed step as defined in `Robot.Setup`
  - `this.step.output` - output of current step
  - `this.step.attachOutput(output: object)` - attach output to current step (object merge)
  - `this.step.output.attach(output: object)` - same as above
- `this.step` current global output is available outside of the context, directly on the scope instance
- `this.will(text: string)` - trigger an inline step describing the following action without requiring a separate step method
  - Intention
    - support for 'virtual' **inline steps** in addition to pre-defined task steps
  - Objective
    - improve log readability with clearly separated step segments where using fully separate step implementation isn't possible or desired
  - Features
    - log description of the action following this call in a visually 
    - fire a custom event with the step description (future)
    - support automatic screenshot for each inline step (future)

0.1.18 / 2021-01-05
===================
## Breaking
`Robot.tools.verifyResult(selector, contents)` ➜ `Robot.tools.verifyResult({selector, contents})`
- accept a single argument instead of separate arguments to be compatible with Playwright API

`Robot.tools.searchPolicyNumber` ➜ `Robot.tools.searchResult` 
- generalize the utility for other use cases

x.y.z / yyyy-mm-dd
==================
## Overview
## Breaking
## Updates