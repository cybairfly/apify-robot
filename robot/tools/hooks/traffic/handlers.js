const {EVENTS} = require('../../../consts');
const log = require('../../../logger');
const {trimUrl} = require('../../generic');
const {parseTargetDomain} = require('../../target');

module.exports = {
	handlers: {
		request: options => url => async request => {
			const {fullUrls = false, hostOnly = false} = options.debug.traffic;

			const requestUrl = request.url();
			const drop = hostOnly && !requestUrl.startsWith(url.origin);
			if (drop) return;

			const method = request.method();
			const type = request.resourceType();

			const cols = {
				status: '-'.repeat(3),
				method: method.padEnd(7, '-'),
				type: type.padEnd(11, '-'),
				host: requestUrl.startsWith(url.origin) ? url.host : '-'.repeat(url.host.length),
				url: fullUrls ? requestUrl : trimUrl(requestUrl),
			};

			log.debug(`► TX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.host} | ${cols.url}`);
		},
		response: options => url => async response => {
			const {fullUrls = false, hostOnly = false} = options.debug.traffic;

			const responseUrl = response.url();
			const drop = hostOnly && !responseUrl.startsWith(url.origin);
			if (drop) return;

			const status = response.status();
			const method = response.request().method();
			const type = response.request().resourceType();

			const ok = response.ok();
			const cols = {
				status: (ok && '√OK') || status.toString(),
				method: method.padEnd(7, '-'),
				type: type.padEnd(11, '-'),
				host: responseUrl.startsWith(url.origin) ? url.host : '-'.repeat(url.host.length),
				url: fullUrls ? responseUrl : trimUrl(responseUrl),
			};

			log.debug(`◄ RX | ${cols.status} | ${cols.method} | ${cols.type} | ${cols.host} | ${cols.url}`);

			if (status >= 400) {
				if (!responseUrl.startsWith('data:') && responseUrl.startsWith(url.origin)) {
					const headers = response.headers();
					const responseText = await response.text().catch(() => null);
					const requestUrl = await response.request().url();
					const requestHeaders = await response.request().headers();
					// const requestPostData = await response.request().postData();
					console.log(status, responseUrl, {
						headers,
						requestUrl,
						requestHeaders,
						responseText,
						// requestPostData
					});
				}
			}
		},
	},
};
