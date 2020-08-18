# Apify Robot (WIP)
#### RPA for the Web: Automation of arbitrary tasks with focus on the web and a simple-to-use API

This project aims to provide a generic solution and simple API to automate any process 
with special focus on repetitive tasks related to specific target websites. The robot 
strives to be as flexible and versatile as possible while making the automation process 
organized and clear at a glance thanks to abstracting the entire flow of automation to 
global configuration defining important aspects of the robot's behavior. You are able 
to define a high-level structure of the process using a simple configuration and then 
provide implementation for various tasks and optionally different hosts (target websites).

- [Robot]()
    - [Setup]() - global or target specific startup and runtime settings for the robot's behavior
    - [Target]() - abstract definition of the target host (website) to perform the automation against
      - [Config]() - utility abstraction to extract target specific data away from the logic of the flow
    - [Tasks]() - abstract definition of a body of work to be performed using `steps` as defined in `setup`
        - [Steps]() - actual implementation of the code to be executed as a part of accomplishing a `task`
        - [Flows]() - loose group of `steps` merged into a single class to serve as a whole or part of a `task`
    - [Context]() 
    - [Tools]()

### Objectives
- flexibility - highly customizable
- versatility - wide range of use cases
- robustness - flow control & monitoring

### Examples
- login check - checking validity of credentials at target host websites
- e-commerce - automated product customization before order completion
- service payments - automated payment processing for various services
- service subscription management - check and change state of subscriptions
- ... etc - pretty much anything you can do manually using a browser

### Overview
The execution of the tasks is handled by a Robot. The robot loads a configuration
with the high-level structure of the process and resolves the order of the tasks with
a dependency tree.

Each task can have multiple sequential steps, which can be either generic or specific
for a particular target. The implementation of the specific step for a particular
target will be automatically loaded by the Robot during the execution of the whole
process.

## Robot 
### [Setup]() ([Target]()) > [Tasks]() > [Steps]()/[Flows]() ([Context]()) > [Tools]()

> Robot takes individual `steps` optionally grouped in `flows` and using common `tools` 
to accomplish preset `tasks` defined in global `setup` within its runtime `context`

Robot handles the execution of all tasks and their steps in the correct order and
handles possible failures of the individual units. Firstly the order of the execution
of the tasks is resolved by building a dependency tree and then flattening the tree
to a ordered array of tasks. 

[comment]: <> (TODO: if the task has two dependencies, which one gets executed first?)
[comment]: <> (dependencies are executed in the order of declaration in the merge array)

[comment]: <> (TODO: this applies generally to other subtasks (sublevels of the tree)
[comment]: <> (tree is built in a way so that most nested deps are executed first up to the parent before the next dep)

### Context
Context is an object with other objects as properties

`{INPUT, OUTPUT, input, output, page, task, step, relay, target, server}`

Property|Type|Description
---|---|---
INPUT|object|Actor input (global)
OUTPUT|object|Actor output (global)
input|object|Robot input
output|object|Robot output
page|object|Puppeteer page
task|object|Task object as defined in configuration
step|object|Step object as defined in configuration
relay|object|Utility object for passing data between `steps` and `tasks`
target|string|Host (target website)
server|instance|Live view and interaction server (WIP)

Robot passes the global context down to the lowest unit of execution to enable maximum 
flexibility in the scope of automation execution. Wide context is also passed to other 
places like setup predicates for execution flow control.

### Target
[Target](robot/target/index.js)
Defines target of automation and target specific behavior, e.g. order of steps (execution sequence) etc. Provides helper methods for adapting tasks to target websites. Definition of automation steps directly in this class body is supported in addition to outsourcing the flow to a separate class with path defined in setup.

[Target.Config](robot/target/config.js)
Utility class to extract target specific data away from the logic of the flow.

### Setup
[Robot.Setup](robot/setup.js)

- global `setup` - defines global behavior of the robot
- target `setup` - defines behavior of the robot based on specific target host (website)

Robot has full control over execution of the automation based on the logic pre-defined 
in its global setup and also recognizes and uses a target specific config over-ride 
where applicable and needed - meaning behavior of the robot can also change based on 
the host (automation target).

The whole process is described in a single configuration file in the root of the project.
The configuration file describes each task and its steps, paths to the implementation
of the steps and output. The configuration can contain the following properties: TODO.

### Tasks
> layout - control - outline - overview - centralize

context -> | `task` | -> (output)
-----------|------|------------
object|runtime sequence outline + flow control predicates|object

Basic abstraction of a complete body of work to be performed by the robot in a generic 
fashion or involving a specific on-line host (target website). Abstract `tasks` are 
composed of individual `steps` performed by the robot exactly as prescribed by `task`'s 
configuration and flow control mechanisms.

A Task breaks up the whole process to a series of smaller steps, where each steps is
the smallest unit of execution. For example a task can be `Payment` with these steps: 
`Search policy`, `Start payment`, `Confirm payment`, `Verify result`, `Backup output`.

Task can have multiple dependencies on other task defined by the `merge` property.
Robot will resolve these dependencies and run all tasks in correct order.

Task can multiple properties influencing the execution of the task:

##### Steps
> simplicity - granularity - execution

context -> | `step` | -> (output)
-----------|------|------------
object|function|object

Basic execution unit of the RPA process handled by the robot. Basically a function receiving a global 
context for maximum flexibility and optionally returning an object which is merged into global output.


##### Flows
> convenience - organization - execution

context -> | flow `step(s)` | -> (output)
-----------|------|------------
object|class method|object

A loose collection of individual steps can be composed into a larger `flow` containing steps wrapped 
and grouped together by a class. Steps of the flow can be organized to match the execution sequence 
for clarity and convenience but they do not control the order of execution in any way and they can be 
interleaved by other intermittent steps outside of the flow defined by the global execution sequence 
configuration. 

Flows can be defined directly in target body or in a separate class located via `flows` path defined in `setup`

> **Flows can also be generic or target specific.**

### Tools
Robot can use various internal or external tools to do work. Internal tools are defined 
within the robot's scope and external tools can be imported from any location into task 
steps, preferably from the pre-existing `tools` directory. Target specific utilities are 
ideally kept within the target's own directory.

# Units of work
Robot can process several levels / types of execution units.

[Task]() - (high level) abstract definition of a task to be performed using `steps` as defined in the configuration

[Step]() - (lower level) actual implementation of the code to be executed as a part of accomplishing a `task`

[Flow]() - loose group of `steps` consolidated into a larger collection to serve as a whole or part of a `task`

**Unit specificity**
- generic - unit without any relationship to a particular target website or common to multiple websites
- target - unit specialized for performing automation at or involving a specific host (target website)

### Task
- layout
- control
- overview
- precision

context -> | `task` | -> (output)
-----------|------|------------
config|collection of `steps`|object

A Task breaks up the whole process to a series of smaller steps, where each steps is
the smallest unit of execution. For example a task can be a `Login`, which will have
3 steps: `Fill username`, `Fill password`, `Submit login form`.

Task can have multiple dependencies on other task defined by the `merge` property.
Robot will resolve these dependencies and run all tasks in correct order.

Task can multiple properties influencing the execution of the task:

### Step
- simplicity
- granularity

context -> | `step` | -> (output)
-----------|------|------------
global context|function|object

Basic execution unit of the RPA process handled by the robot. Basically a function receiving a global 
context for maximum flexibility and optionally returning an object which is merged into global output.


### Flow
- context
- convenience
- organization

context -> | flow `step` | -> (output)
-----------|------|------------
global context|class method|object

A loose collection of individual steps can be composed into a larger `flow` containing steps wrapped 
and grouped together by a class. Steps of the flow can be organized to match the execution sequence 
for clarity and convenience but they do not control the order of execution in any way and they can be 
interleaved by other intermittent steps outside of the flow defined by the global execution sequence 
configuration. 

> Flows can also be generic or target specific.

### Execution control
Predicate functions for code execution flow control:
-  `init` - condition to start a `task|step`
-  `skip` - condition to skip a `task|step`
-  `stop` - condition to make a `task|step` break out of the pre-defined execution sequence
-  `done` - condition to consider a `step` finished and move on to the next one (`task`s are not affected)

TODO - fail when task dependency fails 

[comment]: <> (Describe the configuration options of steps and the "code" and "flow" options)

### INPUT
Actor input (not to be confused with actionable input for the robot used during the automation process)

See actor input schema for details.

[Robot actor input schema](INPUT_SCHEMA.json)

[Actor input schema (docs)](https://docs.apify.com/actors/development/input-schema)

### OUTPUT
TODO

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Apify](https://sdk.apify.com) - Lower level web automation framework

## Contributing

Please read [CONTRIBUTING.md]() for details on our code of conduct, and the process for contributions.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

- Vasek Tobey Vlcek - initial project - [Apify Robot]()
- Matej Vavrinec - design consultant - [Apify Robot]()

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details
