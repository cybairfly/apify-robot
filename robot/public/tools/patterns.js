/**
 * @typedef {import('playwright').Page} page
 * @typedef {import('./types').pattern} pattern
 * @typedef {import('./types').patternType} patternType
 * @typedef {import('./types').patternShape} patternShape
 * @typedef {import('./types').matchPattern} matchPattern
 * @typedef {import('./types').iteratePatterns} iteratePatterns
 */

const log = require('../../logger');
const {getInnerText} = require('../../tools/generic');

const sortByList = (list, array) => array.sort((a, b) => list.indexOf(a) - list.indexOf(b));

/** @type {import('./types').matchPattern} */
const matchPattern = async (page, pattern) => preloadMatchPattern(page)(pattern);

/** @type {import('./types').iteratePatterns} */
const iteratePatterns = async (page, patterns = {}, patternOrder = []) => preloadIteratePatterns(page)(patterns, patternOrder);

/**
 * Curried for use in robot tools preloaded with page
 * @param {page} page
 * @returns {Function}
 */
const preloadMatchPattern = page => async pattern => {
	const excludePattern = async (page, patternShape) => {
		try {
			const $node = await page.$(patternShape.selector);
			await $node.waitForElementState('visible');
			await $node.waitForElementState('stable');
			await $node.waitForElementState('enabled');
			await $node.hover();
		} catch (error) {
			console.log({patternShape});
			log.debug('Element state check failed -> exclude pattern:', patternShape);
			return true;
		}
		log.debug('Element state check passed -> include pattern:', patternShape);
		return false;
	};

	const patternResults = await Promise.allSettled(pattern.map(async patternShape => {
		if (await excludePattern(page, patternShape)) return null;

		patternShape.contents = Array.isArray(patternShape.contents) ?
			patternShape.contents :
			[patternShape.contents];

		const sourceContent = await page.$eval(patternShape.selector, patternShape.function || getInnerText).catch(() => '');
		console.log({patternShape, sourceContent});

		const patternMatch = patternShape.contents
			.some(content => sourceContent.toLowerCase()
				.includes(content.toLowerCase()));

		return patternMatch ? patternShape : null;
	}));

	const [patternMatch = null] = patternResults.map(({status, value}) => value).filter(result => result);

	if (patternMatch) {
		console.log({patternMatch});

		if (patternResults.getError)
			throw patternResults.getError();
	}

	return patternMatch;
};

/**
 * Curried for use in robot tools preloaded with page
 * @param {object} page
 * @returns {Function}
 */
const preloadIteratePatterns = page => async (patterns = {}, patternOrder = []) => {
	const patternTypes = sortByList(patternOrder, Object.keys(patterns));

	for (const patternType of patternTypes) {
		console.log({patternType});
		const patternMatch = await matchPattern(page, patterns[patternType]);

		if (patternMatch)
			return patternType;
	}

	log.debug('No pattern match found:', patternTypes);
};

module.exports = {
	matchPattern,
	iteratePatterns,
	preloadMatchPattern,
	preloadIteratePatterns,
};
