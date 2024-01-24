class Setup extends Robot.Setup {
	// target specific overrides:
	options = {
		server: {
			interface: {
				useScreenshots: true,
			},
		},
	};
}

module.exports = new Setup();
