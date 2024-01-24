const Apify = require('apify');
const crypto = require('crypto');

const log = require('../logger');
const { DEFAULT_OPTIONS } = require('../consts');

const decrypt = async (input, logSecret = false) => {
	const keyStore = await Apify.Actor.openKeyValueStore('keyStore');
	const decrypt = await prepareDecrypt(keyStore);
	log.info(`Encrypted input: [${input}]`);

	try {
		const decrypted = decrypt(input);

		const logOutput = logSecret ?
			`Input decrypted: [${decrypted}]` :
			`Input decrypted: [${input}]`;

		log.info(logOutput);

		return decrypted;
	} catch (error) {
		const logOutput = logSecret ?
			`Failed to decrypt: [${input}]` :
			'Failed to decrypt input';

		log.warning(logOutput);

		return input;
	}
};

const decryptObject = async object => {
	const keyStore = await Apify.Actor.openKeyValueStore('keyStore');
	const decrypt = await prepareDecrypt(keyStore);
	log.info('Encrypted input:');
	console.log(object);

	for (const key of object) {
		try {
			object[key] = decrypt(object[key]);
			log.info(`Input decrypted: [${key}]`);
		} catch (error) {
			log.warning(`Failed to decrypt [${key}]`);
		}
	}
};

const generateKeys = async keyStore => {
	const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
		modulusLength: 1024,
		// publicKeyEncoding: {
		//     type: 'spki',
		//     format: 'der'
		// },
		// privateKeyEncoding: {
		//     type: 'pkcs8',
		//     format: 'der',
		//
		// }
	});

	const publicKeyBuffer = publicKey.export(DEFAULT_OPTIONS.crypto.publicKey);
	const privateKeyBuffer = privateKey.export(DEFAULT_OPTIONS.crypto.privateKey);

	const publicKeyEncoded = publicKeyBuffer.toString('base64');
	const privateKeyEncoded = privateKeyBuffer.toString('base64');

	await keyStore.setValue('publicKey', publicKeyEncoded, {contentType: 'text/plain'});
	await keyStore.setValue('PRIVATE_KEY', privateKeyEncoded, {contentType: 'text/plain'});
};

const getPublicKey = (publicKeyEncoded, options) => {
	const publicKeyBuffer = Buffer.from(publicKeyEncoded, 'base64');
	return crypto.createPublicKey({
		key: publicKeyBuffer,
		...options,
	});
};

const getPrivateKey = (privateKeyEncoded, options) => {
	const privateKeyBuffer = Buffer.from(privateKeyEncoded, 'base64');
	return crypto.createPrivateKey({
		key: privateKeyBuffer,
		...options,
	});
};

const publicEncrypt = function (publicKey, input, options = {}) {
	const bufferFromString = Buffer.from(input);
	const encryptedBuffer = crypto.publicEncrypt({
		key: publicKey,
		...options,
	}, bufferFromString);

	return encryptedBuffer.toString('base64');
};

const privateDecrypt = function (privateKey, input, options = {}) {
	const toDecryptBuffer = Buffer.from(input, 'base64');

	const decryptedBuffer = crypto.privateDecrypt({
		key: privateKey,
		...options,
	}, toDecryptBuffer);

	return decryptedBuffer.toString();
};

const prepareEncrypt = async keyStore => {
	const publicKeyEncoded = process.env.publicKey || await keyStore.getValue('publicKey');
	const publicKey = getPublicKey(publicKeyEncoded, DEFAULT_OPTIONS.crypto.publicKey);

	return input => publicEncrypt(publicKey, input, DEFAULT_OPTIONS.crypto.encrypt);
};

const prepareDecrypt = async keyStore => {
	const privateKeyEncoded = process.env.PRIVATE_KEY || await keyStore.getValue('PRIVATE_KEY');
	const privateKey = getPrivateKey(privateKeyEncoded, DEFAULT_OPTIONS.crypto.privateKey);

	return input => privateDecrypt(privateKey, input, DEFAULT_OPTIONS.crypto.decrypt);
};

const testEncryption = async (keyStore, testString) => {
	const encrypt = await prepareEncrypt(keyStore);
	const decrypt = await prepareDecrypt(keyStore);

	console.log('Testing encryption');
	const encrypted = encrypt(testString);
	console.log({ encrypted });

	console.log('Testing decryption');
	const decrypted = decrypt(encrypted);
	console.log({ decrypted });
};

module.exports = {
	generateKeys,
	getPublicKey,
	getPrivateKey,
	publicEncrypt,
	privateDecrypt,
	prepareDecrypt,
	testEncryption,
	decryptObject,
	decrypt,
};
