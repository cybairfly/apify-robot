module.exports = {
	hooks: {
		preLaunchHooks: null,
		postLaunchHooks: null,
		prePageCreateHooks: null,
		postPageCreateHooks: null,
		prePageCloseHooks: null,
		postPageCloseHooks: null,

		browser: {
			before: null,
			after: null,
		},
		page: {
			before: {
				open: null,
				close: null,
			},
			after: {
				open: null,
				close: null,
			},
		},
	},
};
