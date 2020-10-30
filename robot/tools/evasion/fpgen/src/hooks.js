const { utils: { log } } = require('apify');

const FingerprintGenerator = require('./fingeprint-generator/fingerprint-generator');
const { attachFingerprint } = require('./fingeprint-generator/attach-fingerprint');

const fingerprintGenerator = new FingerprintGenerator();

const addFingerprintToBrowserController = async (browserController) => {
    const fingerprint = await fingerprintGenerator.createFingerprint();

    log.debug('Fingerprint generated', { fingerprint });

    browserController.userData.fingerprint = fingerprint;
};

const overrideNewPageToUseFingerprint = async (browserController) => {
    const { fingerprint } = browserController.userData;
    const { screen, language, userAgent } = fingerprint;

    const oldLaunch = browserController.browser.newPage;
    browserController.browser.newPage = async () => {
        return oldLaunch.bind(browserController.browser)({
            locale: language,
            userAgent,
            viewport: {
                width: screen.width,
                height: screen.height,
            },
        });
    };
};

const overrideTheRestOfFingerprint = async (browserController, page) => {
    const { fingerprint } = browserController.userData;

    await attachFingerprint(fingerprint, page);

    log.debug('Fingerprint Attached', { fingerprint });
};

module.exports = {
    addFingerprintToBrowserController,
    overrideNewPageToUseFingerprint,
    overrideTheRestOfFingerprint,
};
