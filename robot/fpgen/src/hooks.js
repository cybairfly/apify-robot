const { utils: { log } } = require('apify');

const FingerprintGenerator = require('./fingeprint-generator/fingerprint-generator');
const { attachFingerprint } = require('./fingeprint-generator/attach-fingerprint');

const fingerprintGenerator = new FingerprintGenerator();

const addFingerprintToBrowserController = (session) => async (pageId, browserController) => {
    const fingerprint = session.userData.fingerprint || await fingerprintGenerator.createFingerprint();
    log.debug(session.userData.fingerprint ? 'Restoring fingerprint' : 'Fingerprint generated', { fingerprint });
    session.userData.fingerprint = session.userData.fingerprint || fingerprint;
    browserController.launchContext.extend({ fingerprint });
};

const addContextOptionsToPageOptions = async (pageId, browserController, pageOptions) => {
    const { fingerprint } = browserController.launchContext;
    const { screen, language, userAgent } = fingerprint;

    pageOptions.userAgent = userAgent;
    pageOptions.locale = language;
    pageOptions.viewport = {
        width: screen.width,
        height: screen.height,
    };
};

const overrideTheRestOfFingerprint = async (page, browserController) => {
    const { fingerprint } = browserController.launchContext;
    await attachFingerprint(fingerprint, page);
    log.debug('Fingerprint Attached', { fingerprint });
};

module.exports = {
    addFingerprintToBrowserController,
    addContextOptionsToPageOptions,
    overrideTheRestOfFingerprint,
};
