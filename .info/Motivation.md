# Automation requirements
## Customer
As a customer, what I need is...

Request | Purpose | Outcome
-|-|-
Automate an identical process for multiple targets | Reduce workload on staff and focus on other tasks
Dispatch automation requests to a stable endpoint | Easy integration with dependent internal infrastructure
Predictable output schema agreed upon in advance | Reliable integration with internal systems and dashboards | Local store records (object based on output schema & screenshots)
Make sure automation outputs are safe and reliable | Eliminate wrong output caused by unsafe implementation
Full customizability for each automation target | Adapt to target-specific conditions and challenges
Easily switch or modify input options of each run | Determine behavior of individual automation runs | Input schema
Automation tasks available for different purposes | Choose automation task for current input and objective | Input schema
Detect and evaluate expected patterns and scenarios | Match output results with expected project scenarios | Output schema
Launch runs with minimum viable input overrides | Minimize parts of input that need to change for each automation request
Receive the result of time sensitive tasks ASAP or ideally in real time (e.g. credentials validity check) | Reduce latency between automation execution and dependent actions like live feedback (e.g. mobile app)
Verify automation objective completed successfully | Prevent consequences of wrong assumptions about the automation result
Make automations resillient and retry failed requests automatically | Minimize human attention and manual processing
Resolve captchas and simulate human behavior | Bypass access restrictions and limit suspicious behavior
Provide real-time status updates during execution | Monitor automation process and trigger external effects that depend on it in real time before output is available
Provide real-time channel for obstacles like MFA | Obtain crucial data in real-time from service consumers
Live visual interface to observe the automation | Enable an agent to follow automation execution in real time and better understand unknown errors | InterfaceServer
Live visual interface to interact with the automation | Enable an agent to respond to prompts and control the process based on visual information displayed in real time | InterfaceServer
Keep a long term backup of output and screens | Proof of successful automation completion if needed (e.g. insurance payments) | Global store records (output & screens)
Encrypt sensitive input data asymmetrically | Protect credentials and other sensitive information
Decrypt sensitive data at runtime and keep them inside container | Minimize potential for sensitive data leaks | Private key in environment variable or local store record
Redact potentially sensitive details from logs | Minimize potential for sensitive data leaks through logs
Prioritize login speed and evaluation of credentials' validity | Fail fast to provide immediate real-time feedback and/or request different credentials

## Developer
As a developer, what I need is...

Request | Purpose | Outcome
-|-|-
meh | Maximize speed and efficiency of development
Access automation tools on a unified interface | -
Clear and simple contract for automation implementations | Maximize efficiency of extending automation to other targets
Match runtime state against known patterns | Easily determine if current state matches any known scenario
Global context with full runtime awareness | Access automation state and other properties from anywhere
Dynamic runtime helpers and predicates | Determine automation behavior based on runtime side effects
Unify and consolidate all common parts | Maximize code reuse and minimize maintenance overhead
Preset defaults common for entire project | Minimize duplication on aspects shared across automations
Flexible deviation from project defaults | Easily customize default shared aspects where necessary
Centralize project setup in a single location | Keep all elementary properties of a project in one place
Break automation steps to isolated blocks | Support automatic actions at each step (logging, reporting, error handling, isolated precision retries etc.) | Actor logs
Automate logging for every step and action | Minimize manual logging to necessary exceptions | Actor logs
Automate logging for events of interest | Easily keep track of navigations, DOM events etc. | Actor logs
Easily change verbosity of automated logs | Reduce clutter in regular logs and increase information density as needed | Actor logs
Maximize visual at-a-glance readability of logs | Inspect automation history and jump to crucial parts quickly thanks to easy visual orientation | Actor logs
Use ready-made tools for common patterns | Reduce the amount of custom coding and duplication
Redact suspected secrets automatically | Minimize potential for sensitive data leaks through logs
Report errors to external channels | Monitor effect of updates in production environment | Monitoring channel (Slack)
Include crucial details in error reports | Provide useful troubleshooting details at a glance | Monitoring channel (Slack)
Options to affect error reporting verbosity | Minimize noise in default error reporting mode | Monitoring channel (Slack)
Control behavior based on proxy settings | Adapt to different proxy groups and providers
Manage proxy sessions for various retries | Adapt proxy rotation to different retry scenarios
Ping proxy session pools automatically | Keep proxy sessions alive beyond their regular lifespan
Advanced error handling capabilitites | Determine error consequences and control runtime behavior
Custom errors with inheritance support | Create and reuse a dictionary tree with common errors
Support error rethrows and overrides | Enable overrides of default error messages and properties
Custom error flags and actionable properties | Precise runtime control and preventing useless blind retries
Detect error patterns automatically | Handle errors unhandled explicitly with correct label or routine
Provide a clear interface for deciding retry behavior | Easily determine all conditions of a retry before the retry attempt
Collect debug buffers and information on errors | Maximize debugging efficiency and minimize the need for re-runs and manual testing | Local store records (page contents & screens)
Unify all repeating patterns with ready-made tools and abstractions | Minimize duplication and maximize efficiency of development
Observe (blocked) browser traffic in real time | Follow traffic along with context during execution and notice issues caused by request filters
Capture browser traffic for inspection | Easily debug and develop parts of automation depending on and interacting with traffic directly
Block waste traffic based on global presets and target-specific overrides | Reduce the amount of wasteful traffic and improve efficiency
Seamless support for different browsers and automation libraries | Easily switch runtime environment during testing and development
Fully automated visual live feed and interface | Control or debug automation process in containerized environment
Universal server for external communication | Real-time interaction and status updates between the automation and remote infrastructure
Support for a custom real-time protocol | Predictable contract for bi-directional real-time communication
Runtime-aware tools preloaded with internals | Compact implementation code with minimal needless repetition
Output schema with default output presets | Reliable output always conforming to a predefined schema
Session pool support across parallel runs | Enable session management in a highly concurrent environment

## Manager
Request | Purpose | Outcome
-|-|-
Accurate error assesment and real-time alerts | Keep track of project performance and problems | Monitoring channel (Slack)
Proactive monitoring with useful error details | Maximize reaction time and maintenance efficiency | Monitoring channel (Slack)
Isolated updates to individual implementations | Prevent interference with other implementations
Globally applicable updates of generic parts | Minimize maintenance cost, time and overhead
Regular project performace statistics or charts | Keep track of performance fluctuations over time | Statistics channel (Slack)