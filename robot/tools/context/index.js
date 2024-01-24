/* eslint-disable no-underscore-dangle */
const log = require('../../logger');

const syncContext = robot => ({
	page: (page = null) => {
		robot.page = page;
		robot.scope.page = page;
		robot.context.page = page;
	},
	task: task => {
		// robot._task = task;
		const taskCopy = task;
		robot.context.task = taskCopy;

		if (robot.scope)
			robot.scope.task = taskCopy;
	},
	step: step => {
		const outputPrototype = {};

		Object.defineProperty(outputPrototype, 'attach', {
			value(output) {
				if (!output || typeof output !== 'object') {
					console.error('Ignoring output - not an object');
					return;
				}

				Object.entries(output).map(entry => {
					const [key, value] = entry;
					this[key] = value;
				});

				return this;
			},
			enumerable: false,
		});

		const output = Object.create(outputPrototype);

		const stepCopy = {
			...step,
			_output: output,
			get output() {
				return this._output;
			},
			set output(output) {
				try {
					Object.entries(output).map(entry => {
						const [key, value] = entry;
						this._output[key] = value;
					});
				} catch (error) {
					log.error(`Failed to set step output: ${output}`);
				}
			},
			will(text) {
				if (typeof text !== 'string') {
					log.error('Custom steps only accept step name as an argument');
					return;
				}

				// TODO fire custom event
				// TODO fire websocket event
				log.default(' '.repeat(100));
				log.default(`NEXT [${text}]`);
				log.default('-'.repeat(100));
			},
		};

		stepCopy.attachOutput = function (output) {
			this.output = output;
			return this.output;
		};

		robot.context.step = stepCopy;

		if (robot.scope)
			robot.scope.step = stepCopy;
	},
	output: output => {
		if (!output) return;

		try {
			Object.entries(output).map(entry => {
				const [key, value] = entry;
				robot._output[key] = value;
			});

			robot.context.output = robot.output;

			if (robot.scope) {
				robot.scope.output = robot.output;

				if (robot.scope.task)
					robot.scope.task.output = robot.output;
			}
		} catch (error) {
			log.error(`Failed to set robot output: ${output}`);
		}
	},
});

module.exports = {
	syncContext,
};
