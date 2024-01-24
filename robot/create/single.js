class Singleton {
	constructor(Class, name = '') {
		if (Class.instance)
			return Class.instance;

		this.name = name;

		Class.instance = this;

		return this;
	}

	getName() {
		return this.name;
	}
}

module.exports = Singleton;
