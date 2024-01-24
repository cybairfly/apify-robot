module.exports = {
	websocket: {
		events: {
			userId: userId => ({
				options: {
					getData: false,
					action: 'sendhook',
				},
				message: {
					name: 'userId',
					data: {
						userId,
					},
				},
			}),
			login: ATT_loginStatus => ({
				options: {
					getData: false,
					action: 'sendhook',
				},
				message: {
					name: 'status',
					data: {
						isLoginStatus: true,
						loginStatus: ATT_loginStatus,
					},
				},
			}),
			phoneNumbers: phoneNumbers => ({
				tx: {
					options: {
						getData: true,
						action: 'sendhook',
						timeout: 300 * 1000,
					},
					message: {
						name: 'phoneNumbers',
						data: {
							phoneNumbers,
						},
					},
				},
				rx: {
					message: {
						name: 'phoneNumbers',
						data: {
							phoneIndex: 'number',
							phoneNumber: 'string',
						},
					},
				},
			}),
			oneTimePass: {
				tx: {
					options: {
						getData: true,
						action: 'sendhook',
					},
					message: {
						name: 'oneTimePass',
					},
				},
				rx: {
					message: {
						name: 'oneTimePass',
						data: {
							otpCode: 'string',
						},
					},
				},
			},
			accountType: accountType => ({
				options: {
					getData: false,
					action: 'sendhook',
				},
				message: {
					name: 'accountType',
					data: {
						accountType,
					},
				},
			}),
			error: (error, retry, data) => ({
				tx: {
					options: {
						getData: true,
						action: 'sendhook',
					},
					message: {
						name: 'error',
						data: {
							retry,
							...data,
							// error,
							function: fn.name,
							message: error.message,
						},
					},
				},
				rx: {
					message: {
						name: 'error',
						data: {
							retry: 'boolean',
							input: 'object',
						},
					},
				},
			}),
			retry: message => ({
				options: {
					getData: false,
					action: 'sendhook',
				},
				message: {
					message: {
						...message,
						// ACK retry
						name: 'retry',
					},
				},
			}),
			exception: error => ({
				options: {
					getData: false,
					action: 'sendhook',
				},
				message: {
					name: 'exception',
					data: {
						error: error.message,
					},
				},
			}),
			status: {
				socket: {
					options: {
						getData: false,
						action: 'sendhook',
					},
					message: {
						name: 'status',
						data: {
							status: 'Connection established',
						},
					},
				},
				target: {
					loading: {
						options: {
							getData: false,
							action: 'sendhook',
						},
						message: {
							name: 'status',
							data: {
								status: 'Loading website',
							},
						},
					},
					login: {
						session: username => ({
							message: {
								name: 'status',
								data: {
									status: `Valid session: ${username}`,
								},
							},
						}),
						action: username => ({
							message: {
								name: 'status',
								data: {
									status: `Logging in as ${username}`,
								},
							},
						}),
						result: ATT_loginStatus => ({
							message: {
								name: 'status',
								data: {
									status: `Login result: ${ATT_loginStatus}`,
								},
							},
						}),
					},
					bills: {
						options: {
							getData: false,
							action: 'sendhook',
						},
						message: {
							name: 'status',
							data: {
								status: 'Downloading statements',
							},
						},
					},
					account: {
						checkType: {
							options: {
								getData: false,
								action: 'sendhook',
							},
							message: {
								name: 'status',
								data: {
									status: 'Checking account type',
								},
							},
						},
						result: accountType => ({
							options: {
								getData: false,
								action: 'sendhook',
							},
							message: {
								name: 'status',
								data: {
									status: `Account type: ${accountType}`,
								},
							},
						}),
					},
				},
			},
		},
	},
};
