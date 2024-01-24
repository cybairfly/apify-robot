const Apify = require('apify');
const log = require('../../logger');

const saveScreenshot = async ({id, name, page, retryIndex, store}) => {
    // Cannot take screenshot with 0 width.
    try {
        await page.waitForFunction(() => document.readyState !== 'loading').catch(() => null);
        const screenshotBuffer = await page.screenshot({type: 'jpeg', quality: 70, fullPage: true});
        const fileName = `PAGE-SNAP-${name || (retryIndex ? `RETRY_${retryIndex}` : 'FINAL')}-${id || Date.now()}`;

        if (store)
            await store.setValue(fileName, screenshotBuffer, {contentType: 'image/png'});

        else
            await Apify.Actor.setValue(fileName, screenshotBuffer, {contentType: 'image/png'});

        const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
        return `https://api.apify.com/v2/key-value-stores/${storeId}/records/${fileName}`;
    } catch (error) {
        log.debug(error);
        log.warning('Failed to take a screenshot');
    }
};

const savePageContent = async ({id, name, page, retryIndex, store}) => {
    try {
        const fileName = `PAGE-HTML-${name || (retryIndex ? `RETRY_${retryIndex}` : 'FINAL')}-${id || Date.now()}`;

        if (store)
            await store.setValue(fileName, await page.content(), {contentType: 'text/html'});

        else
            await Apify.Actor.setValue(fileName, await page.content(), {contentType: 'text/html'});

        const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
        return `https://api.apify.com/v2/key-value-stores/${storeId}/records/${fileName}`;
    } catch (error) {
        log.debug(error);
        log.warning('Failed to capture page content');
    }
};

const saveOutput = async ({page, name, input, output: currentOutput, retryIndex, store}) => {
    const {id} = input;
    const pageContentUrl = await savePageContent({id, name, page, retryIndex, store}) || null;
    const screenshotUrl = await saveScreenshot({id, name, page, retryIndex, store}) || null;
    const actorRunUrl = `https://my.apify.com/view/runs/${process.env.APIFY_ACTOR_RUN_ID}`;

    const output = {...currentOutput, actorRunUrl, screenshotUrl, pageContentUrl};

    if (store)
        await store.setValue('OUTPUT', JSON.stringify(output), {contentType: 'application/json'});

    else
        await Apify.Actor.setValue('OUTPUT', JSON.stringify(output), {contentType: 'application/json'});

    return output;
};

const filterOutput = output => Object.fromEntries(Object.entries(output).filter(([key, value]) => value));

const maybeFilterOutput = ({options, output}) => options.output?.filter ? filterOutput(output) : output;


module.exports = {
    saveOutput,
    savePageContent,
    saveScreenshot,
    maybeFilterOutput,
};
