const Script = require("./index");
const {join} = require('path');
const {writeFileSync} = require('fs');

const fun = async ({ input: { debug }, state: { username } } = context) => {
	this.will('start navigation');
	await Promise.all([
		page.goto(URLS.login),
		page.waitForNavigation(),
	]);

	this.will('verify session');
	await Promise.race([
		page.waitForSelector(SELECTORS.frame.auth),
		page.waitForSelector(SELECTORS.anchor.login),
		page.waitForSelector(SELECTORS.anchor.logout, { state: 'attached' }),
	]);
	
	this.will('initiate login');
	if (URLS.login.includes('appleid'))
		await human.click(SELECTORS.anchor.login);

	this.will('intercept frame');
	await page.waitForSelector(`${SELECTORS.frame.auth}, ${SELECTORS.homePage}`);
	const frameElement = await page.$(SELECTORS.frame.auth);
	const originalFrame = frameElement && await frameElement.contentFrame();
	const frame = (originalFrame && integrateInstance({
		page,
		server,
		instance: originalFrame,
	})) || page;

	human = new Robot.Human(frame, { debug });
	await frame.waitForSelector(SELECTORS.input.username);
	console.log(human);
	console.log(page);

	this.will('remember user');
	const isUserPersisted = await frame.$eval(SELECTORS.input.remember, node => node.checked = true).catch(error => false);
	this.step.attachOutput(OUTPUTS.userSaved(isUserPersisted));

	const existingUsername = await frame.$eval(SELECTORS.input.username, node => node.value);
	if (!existingUsername) {
		this.will('enter username');
		if (input.username)
			await page.type(SELECTORS.input.username, input.username);
		else {
			const { usernameAborted } = Object(await enterPromptedUsername(context));
			if (usernameAborted)
				return OUTPUTS.processAborted;
		}

		this.will('submit username');
		const [usernameResponse] = await Promise.all([
			page
				.waitForResponse(PREDICATES.user)
				.catch(handleMissingResponse(page)),
			human.press('Enter'),
		]);
	}

	try {
		await frame.waitForSelector(SELECTORS.input.password);
	} catch (error) {
		const pattern = await iteratePatterns(page, PATTERNS);
		if (pattern)
			return OUTPUTS[pattern];

		throw new Robot.errors.Login({ error });
	}

	this.state.frame = frame;
	this.state.human = human;

	return OUTPUTS.loginReady;
}

const script = new Script(fun);

const path = join(__dirname, 'script.txt');
writeFileSync(path, script.text);