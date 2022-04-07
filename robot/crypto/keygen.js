const Apify = require('apify');

const {
    generateKeys,
    testEncryption,
} = require('./index');

Apify.main(async () => {
    // const {generateKeys, X509Filename} = await Apify.getInput();

    if (Apify.isAtHome()) {
        console.log('Generating keys on platform disabled for security reasons');
        return;
    }

    console.log('Generating keys from certificate...');
    const keyStore = await Apify.openKeyValueStore('keyStore');
    await generateKeys(keyStore);
    // await _keyPairFromX509(X509Filename, keyStore);
    console.log('Keys have been generated and stored in key store');

    await testEncryption(keyStore, 'Encryption and decryption success');
});
