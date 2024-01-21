const vm = require('vm');

class Script {
	constructor(input) {
		this.code = typeof input === 'string' ? this.scriptify(input) : input;
		this.text = typeof input === 'string' ? input : this.stringify(input);
	}

	scriptify = text => new vm.Script(text);

	stringify = code => JSON.stringify(code.toString());
}

module.exports = Script;