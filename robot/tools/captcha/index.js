const Apify = require('apify');

const { log } = Apify.utils;

const {
    ANTI_CAPTCHA_TOKEN,
    APIFY_PROXY_PASSWORD,
} = process.env;

class CaptchaSolver {
    /**
    *
    * @param {string} token
    * @param {Stats} stats
    */
    constructor(stats = {}) {
        this.token = ANTI_CAPTCHA_TOKEN;
        this.solved = 0;
        this.stats = stats;
    }

    async getSolution(page, userAgent) {
        try {
            await page.waitForSelector('#login-recaptcha');
        } catch (e) {
            log.error('No #login-recaptcha found');
            return null;
        }

        const siteKey = await page.evaluate(() => {
            const match = document.querySelector('#login-recaptcha');
            return match ? match.getAttribute('data-sitekey') : null;
        });

        if (!siteKey)
            throw new Error('Cannot find site key');

        const ncobj = {
            clientKey: this.token,
            task: {
                type: 'NoCaptchaTaskProxyless',
                websiteURL: await page.url(),
                websiteKey: siteKey,
                userAgent,
            },
        };

        log.debug('Started anticaptcha task');

        const response = await Apify.utils.requestAsBrowser({
            url: 'https://api.anti-captcha.com/createTask',
            method: 'POST',
            proxyUrl: `http://groups-SHADER:${APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
            payload: JSON.stringify(ncobj),
            json: true,
        });

        this.stats.tasks++;

        if (response.body.errorId > 0) {
            this.stats.failed++;
            throw new Error(`AntiCaptcha ${response.body.errorCode}: ${response.body.errorDescription}`);
        }

        const getSolution = () => Apify.utils.requestAsBrowser({
            url: 'https://api.anti-captcha.com/getTaskResult',
            method: 'POST',
            proxyUrl: `http://groups-SHADER:${APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
            payload: JSON.stringify({
                clientKey: this.token,
                taskId: response.body.taskId,
            }),
            json: true,
        });

        log.debug('Waiting for solution');

        let solution;
        do {
            await new Promise(resolve => setTimeout(resolve, 5000));
            try {
                const response = await getSolution();
                solution = response.body;
                if (solution.errorId > 0) throw new Error(`${solution.errorCode}: ${solution.errorDescription}`);
            } catch (error) {
                if (error.message.includes('ERROR_')) {
                    log.error(`AntiCaptcha getSolution error: ${error.message}`);
                    this.stats.failed++;
                    return null;
                }
            }
        } while (!solution || solution.status !== 'ready');

        this.stats.solved++;
        log.debug('Solution found', { solution });
        this.solved++;
        const gcr = solution.solution.gRecaptchaResponse;

        return gcr;
    }

    getSolvedCount() {
        return this.solved;
    }
}

module.exports = {CaptchaSolver};
