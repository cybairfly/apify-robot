# Apify Robot (WIP)
### Web RPA. *EXTREME SCALING*.
---
> Looking for a full-featured web automation suite
- designed for **ROBUSTNESS** and high reliability?
- optimized for ***RIDICULOUS*** horizontal scalability?
- running on tens of targets? Hundreds? Thousands?
> Look no further.
---
> WIP! = Fully capable but not a polished product by any means! Feel free to get in touch should you need any help.
---

Project aims to provide a generic solution and simple API to automating any abstract process at large scale with extra focus on repetitive tasks performed at specific web hosts (websites, APIs...). The framework aims for maximum versatility and flexibility while making the automation process well structured, clear and organized thanks to describing the entire automation abstraction in project setup and providing convenient tools and templates for quick and efficient scaling of specific implementations sharing the same or similar abstraction. Plus everything you need to run at scale with minute control when required. Automated reporting, error handling, session management... it's all there.

## Overview
  - [Robot](#robot)
    - [Model](#model) - example of default project structure (completely customizable recommendation)
    - [Setup](#setup) - global or target specific startup and runtime behavior settings of the framework
    - [Scope](#scope) - generic container for the implementation of target independent automation tasks
    - [Target](#target) - container for implementation of automation steps performed against specific target
      - [Config](#targetconfig) - utility abstraction to extract scope/target specific data away from the main logic
    - [Tasks](#task) - abstract definition of a body of work to be performed by executing more granular `steps`
        - [Steps](#steps) - actual implementation of the code to be executed as part of accomplishing a `task`
    - [Context](#context) - global source of runtime awareness and container for common runtime-aware tools
    - [Errors](#errors) - custom error wrapper for advanced error handling and a dictionary of common errors
    - [Tools](#tools) - convenience tools for quick and efficient development and maintenance of automations

## Examples
- login check - checking validity of credentials at target host websites
- e-commerce - automated product customization before order completion
- service payments - automated payment processing for various services
- service subscription management - check and change state of subscriptions
- ... and more - anything you can do in any web browser.

## Objectives
- flexibility - highly customizable to fit every project
- scalability - rapid scaling of the automation model
- versatility - support for a wide range of use cases
- robustness - predictable flow control & monitoring

## Features
### Flexibility
Many concepts are recommended defaults and can be adapted to fit the needs of any automation project.

- #### Project scope
  Framework can handle an arbitrary number of automation tasks within a single automation project. Alternatively, the granularity of projects per tasks can be as fine as required. Each task can be also hosted in its own separate project.

- #### Project structure
  Paths to all crucial parts of the project are customizable. Recommended default structure:
  - project root
    - robot - contains global setup and represents the automation framework in the project
    - tasks - contains automation implementations
      - generic - contains generic implementations shared by any of the automation tasks and targets
      - targets - contains target-specific implementations intened for particular web hosts (websites, APIs...)
    - tools - contains generic tools reusable by different tasks and targets outside of the automation process

- #### Dynamic properties
  Different aspects of the project can be adapted to its specific needs dynamically, through custom logic executed during run time and affecting current context or behavior of the framework (e.g. input ID, proxy selection etc.)

- #### Execution control
  Optional step predicates enable precise conditional control over execution of the automation and early exit when things don't follow the ideal path and provide assurance of successful execution of preceding steps otherwise.

### Scalability
Projects can be rapidly scaled to perform identical tasks with different host implementations thanks to a simple public contract, readily available debugging tools and the ability to consolidate and reuse generic parts of the automation process across all targets.

### Versatility
Framework enables creation of automations with arbitrary complexity. Generic code can be arbitrarily mixed and interact with target-specific code to perform any imaginable tasks with maximum implementation and runtime efficiency. Common features frequently used at runtime or during debugging are an input option toggle away and ready for use when needed.

### Robustness
Creating robust automations capable of handling all possible scenarios gracefully is not easy. The framework helps with that by providing efficient debugging tools, support for retries at the minutest level and custom error models designed to handle or classify known or unknown edge cases and report their details to external notification channels after directing both runtime context and the automation process accordingly.

### Readability
Implementation of tasks is designed as a linear sequence of steps and events with maximum readability in mind that strives to make it easy to follow the entirety of the automation process without the need to jump out of context between various modules unnecessarily. The idea is to keep the main execution flow as fluent and continuous as possible both during development and maintenance to make it easy to follow the process as a whole along with surrounding context.

### Reusability
One of the most important features is the ability to share and reuse any generic code throughout the entire automation project to prevent numerous duplication of general purpose code and reduce maintenance of reusable generic segments to a minimum. Furthermore, tasks can also depend on and be reused by any other tasks as defined by project setup and resolved with a dependency tree at startup.

#### Composability
High reusability and low maintenance ratio is achieved by arbitrarily mixing generic and target-specific implementations.

Implementation example:

> T - target-specific steps

> G - reusable generic steps

- Login
  - G | obtain data from a remote resource (e.g. list of targets with credentials)
  - G | decrypt secrets using local private key
  - T | prepare target website for a login attempt
  - T | trigger login action using decrypted credentials
  - G | approximate user location using a remote API
  - G | query national holiday information from a remote API
  - G | request more details for multi-factor authentication
  - T | utilize additional details (OTP) and handle the MFA
  - G | detect and handle login errors or expected patterns
  - G | report validity of credentials to a remote endpoint
  - G | store encrypted input and entry ID to local dataset
- Payment
  - T | prepare user account to desired starting point (e.g. profile selection)
  - G | reuse MFA channel with remote consumer to optimize profile selection (maybe)
  - T | prepare user account for desired automation objective (e.g. insurance payment)
  - T | obtain vital payment information from target (e.g. name, due date, payment amount)
  - G | report payment details to remote endpoint for internal pairing and real-time verification
  - G | obtain payment confirmation code from remote automation consumer (e.g. payment issuer)
  - T | apply payment confirmation details obtained in real time to the automation process
  - G | prompt payment details with live agent for visual inspection and interaction
  - G | abort automation prematurely based on input or real-time interaction (optional)
  - T | finish automation objective (e.g. by confirming payment details and action)
  - T | verify success of automation objective or assume error otherwise
  - G | store a backup of output and payment confirmation to long-term storage
  - G | report automation result to remote infrastructure in real time (mobile app)
  - T | detect and handle or classify target-specific errors (maybe)
  - G | detect and handle or classify (un)expected errors or patterns
  - G | evaluate current proxy provider and/or IP through a remote API
  - G | report errors and error details to a monitoring channel (maybe)

### Documentation
Important features like various automation utilities available in the context or directly on implementation instances (should) have properly documented interface and vital information readily available through IDE to make writing implementations of the automation as efficient and easy as possible.

### Automation
Curiously enough, the automation framework aims to automate many processes related to building automation projects... and maintaining them afterwards.

Control entire automation process dynamically at each step based on current context and result of the preceeding step(s). Report each step and its status in real time to remote endpoints. Support granular precision retry of each individual step with optional real-time input. Produce a sequence of verbose logs with performed actions and capture debug buffers for each step and/or the final result. Maintain and keep-alive a pool of working proxy IPs for each individual target. Provide convenient tools for efficient development and maintenance of automations. And more...

### Robot 
### [Setup](#setup) > [Scope](#scope)/[Target](#target) > [Context](#context) > [Tasks](#task) > [Steps](#steps)

> Robot finds target `scope` and takes single `steps` of `tasks` defined in local or global `setup` using its runtime `context` to achieve the goals of desired automation(s)

Execution of tasks is handled by an instance of the Robot. The framework loads the project setup containing a high-level structure and description of the automation process and resolves the order of the tasks with a dependency tree to ensure mutually dependent tasks are executed in the correct order, while handling possible errors at individual steps. Control flow predicates determine actual execution sequence depending on intermediate states during the automation. Each task can contain a sequence of many steps which can be either generic or specific for a particular remote target. Implementation of a step for a particular target will be automatically loaded during execution of the whole process.

### Startup
Example of the minimal startup below including:
- **navigate the npm package to project root**
- check basic input shape requirements
- build an instance based on project setup
- start the automation using that instance

```
const Apify = require('apify');
const Robot = require('apify-robot');
const setup = require('./robot');

const route = __dirname;

Apify.Actor.main(async () => {
    const input = (await Apify.Actor.getValue('INPUT')) || require('./INPUT_LOCAL');
    const OUTPUT = await Robot.route(route).check(input).build(setup).start();
});
```

### [Model](robot/model)
Refer to the link above for a basic model of default project structure.

### [Input](INPUT_SCHEMA.json) 
Default input schema (without custom properties specific to the project)

### [Output](OUTPUT_SCHEMA.js) 
Output schema should be defined according to specific needs of the project.

### Context
Context is a container for the main state and properties of the robot and its tasks. Context is passed down to the lowest unit of execution and other places throughout run time to provide maximum flexibility for both inside and outside of the execution scope. Unified context ensures complete automation awareness at any point and makes it easy to extract and use any preloaded automation tools or access different properties and current state of the automation from anywhere.

`Context <{input, output, page, task, step, state, pools, events, tools, server}>`

Property|Type|Description
---|---|---
input|object|Robot and actor input
output|object|Robot and actor output
page|object|Browser page instance
task|object|Task as defined in setup
step|object|Step as defined in setup
state|object|Utility object for passing data between `steps` and `tasks`
pools|object|Hosts pools of Apify SDK (browser pool, session pool)
tools|object|Preloaded runtime-aware convenience automation tools
server|instance|Universal server for real-time inspection and interaction

### [Setup](robot/setup/index.js)
- global `setup` - defines default behavior of the robot
- target `setup` - defines behavior overrides for a specific target host or website

Robot has full control over execution of the automation based on the logic defined in project setup but it also recognizes and adapts to target specific overrides where necessary, meaning behavior of the framework can also change based on the host (automation target).

High level abstraction of the automation process is described in a single project setup file in the root of the project. Among other things, this file describes each task along with its steps and global paths to the implementation of the steps and their expected output. The configuration can contain the properties described in its model class linked above.

### [Scope](robot/scope/index.js)
Defines a container for arbitrary parts of the automation. Collections of individual steps can be composed in this wrapper. Steps in the scope can be interleaved by other intermittent steps outside of the scope as defined by the sequence in global or local setup.

```
class Scope extends Robot.Scope {
    // optional constructor & super
    // (automatic context bindings)
    constructor(context, robot) {
        super(context, robot);
    }

    [task] = (context) => ({
        [step]: (context) => {
           <!-- implementation -->
        }
    });
}
```

##### [Scope.Config](robot/target/config.js)
Utility class to extract target specific data away from the logic of the scope.

### [Target](robot/target/index.js)
Extends [Scope](robot/scope/index.js)

Defines a scope specific to one particular target of automation and provides support for target-specific behavior overrides when needed (e.g. modified execution sequence). Provides helper methods for adapting tasks to the target if necessary.

```
class Target extends Robot.Target {
    [task] = (context) => ({
        [step]: (context) => {
           <!-- implementation -->
        }
    });
}
```

##### [Target.Config](robot/target/config.js)
Utility class to extract target specific data away from the logic of the scope.

### Task
Define runtime sequence layout and control flow predicates for a particular automation objective.

context ➜ | scope/target `task` ➜ | [output]
-|-|-
object|task closure|object

Basic abstraction of a complete body of work to be performed by the robot in a generic fashion or involving a specific web host as the target. These abstract `tasks` are composed of individual `steps` performed by the robot exactly as prescribed by `task`'s setup and flow control mechanism. Tasks further reduce the whole automation process into a series of granular steps, where each steps is the smallest unit of execution for the Robot. An example task would be `InsurancePayment` with steps such as these: `Search policy`, `Start payment`, `Confirm payment`, `Verify result`, `Backup output`.

Multiple dependencies on other preceding tasks can be defined in the task definition. The framework will resolve them at run time and run all tasks in correct order.

```
[task] = (context) => ({
    <!-- steps -->
});
```

#### Steps
Define the smallest unit for actual execution logic of the automation tasks.

context ➜ | scope/target `task` ➜ | task `step(s)` ➜ | [output]
-|-|-|-
object|task closure|task method(s)|object

Basic execution unit of the automation process handled by the robot. Basically a virtually isolated function receiving global context for maximum awareness and flexibility, optionally returning an output object which gets merged with global output.

Step specificity:
- generic - unit without a tight coupling to a particular target website or common to different websites
- target - unit specialized for performing automation at or involving a specific host (e.g. target website)

```
[task] = (context) => ({
    [step]: (context) => {
    <!-- implementation -->
    },
    [step]: (context) => {
    <!-- implementation -->
    },
    ...
});
```

### [Errors](robot/errors/index.js)
Custom error handling with native support for rethrows and specific flags affecting consequent behavior of the framework along with an extendable dictionary of common errors helps cover any scenarios, expected or unexpected.

Examples:
- `Robot.errors.Network` - throw, print and report a generic network error
- `Robot.errors.access.Blocked` - throw, print and report a generic access error
- `Robot.errors.session.Rotate` - rotate proxy session before retrying a failed action
- `Robot.errors.Status({error, retry: true, retireSession: true, statusCode: 403})` - rethrow previous error as cause of the custom error, retire proxy session before retrying failed action and print a message with failed status code before reporting the error to external monitoring channel

### [Tools](robot/public/tools/index.js)
Robot can use various internal or external tools to do work. Internal tools are available on the robot and external tools can be imported from any location into task steps, preferably from the pre-existing `tools` directory. Utilities specific to a single target are ideally kept within the target's own directory.

#### [Login](robot/public/tools/index.js)
Convenient abstractions for a very common automation activity, authorization. 

Future version will offer a fully automated login experience utilizing provided secrets.

#### [Human](robot/human/index.js)
Humanized toolset for both manual and automated simulation of human behavior.

#### [Server](robot/server/index.js)
Universal server for real-time network communication (WIP) and visual inspection of and interaction with the automation.

#### Proxy
Internals of the framework along with other features like custom errors and flags ensure correct rotation of proxy sessions and fingerprints on different occasions like fresh runs or retries and ping the proxy pools at the target level to ensure that sessions will remain valid for extended periods of time.

#### Patterns
Convenient abstractions for a very common automation activity, pattern matching. 

Future version will provide a unified API for both back-end and front-end evaluation.

#### Logging
Automated or manual logging of performed actions with distinct visual hints for quick orientation.

#### Reports
Automated error classification and reporting to external monitoring channel(s).

#### Etc.
More information in type definitions and inline documentation (WIP)

### Demo
```
class Target extends Robot.Target {
    [tasks.login] = ({page, human}) => ({
        [steps.prepareTarget]: async (context) => {
            await Promise.all([
                page.gotoDom(URLS.login),
                page.waitForResponse(PREDICATES.start)
            ])
            ...
            return OUTPUTS.targetPrepared;
        },
        [steps.prepareLogin]: async ({state: {username, password}}) => {
            await human.type(SELECTORS.input.username, username);
            await human.type(SELECTORS.input.password, password);
            ...
            return OUTPUTS.loginPrepared;
        },
        [steps.attemptLogin]: async (context) => {
            await human.press('Enter');
            ...
            return OUTPUTS.loginSuccess;
        },
        [steps.reportStatus]: async ({server, output}) => {
            await server.send(EVENTS.loginStatus(output));
            ...
        }
    });
    ...
}
```

### FAQ
Why not have all individual automation steps in separate files?
- Efficiency. The aim is to minimize needless overhead in terms of imports and boilerplate for each task. One more useful side effect is the implementation more closely resembling actual flow of the automation process. This helps grasp the idea of what's happening with minimal attention fragmentation.

## Deployment
Personal introduction to the automation framework used is currently recommended due to largely missing documentation.

Presence of the library installed as an `npm` module is represented by the directory with the main setup of the project and framework, typically `./robot` in the project root. Directory structure, paths and other aspects are completely configurable and supplied to the framework at run time through the main setup.

Additional information:
- [Changelog](https://gitlab.com/cybaerfly/apify-robot/-/blob/master/CHANGELOG.md) - diff from past versions

## Dependency
* [Apify](https://sdk.apify.com) - a lower level web automation framework

More details in [package.json](package.json)

## Contributing
Please read [CONTRIBUTING.md]() for details on our code of conduct, and the process for contributions.

## Versioning
We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://gitlab.com/cybaerfly/apify-robot/-/tags). 

## Authors
- Vasek Tobey Vlcek - maintainer
- Peter Patek - design consultant
- Matej Vavrinec - design consultant
- Milán Vasárhelyi - docs & development

List of [contributors](https://gitlab.com/cybaerfly/apify-robot/-/graphs/master) participating in this project.

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details

## Roadmap
```
clean up and refactor internals and adopt ESM     20%
design a task builder for target implementations
design and implement a generic real-time protocol    20%
redesign built-in server for real-time communication    50%
extract and publish auxiliary tools as separate packages    50%
support non-boolean output formats and output segmentation per task   30%
safely re-introduce generic error handling to reduce codebase and monitoring noise
improve pattern matching toolset and extend its capabilities to verification polling etc.   30%
optimize runtime efficiency with pattern racing and generic observer for dynamic content
improve automated logging and debugging tools for more efficient troubleshooting    70%
further automate and unify login handling with a higher-level abstraction toolset   50%
support complex pattern matching and white-list approach in traffic filters
improve types and documentation for crucial parts of the framework  5%
```