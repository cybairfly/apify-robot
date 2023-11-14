const Robot = require('apify-robot');

const {
    consts: {tasks, steps},
    outputs,
} = require('../../../robot');

class Config extends Robot.TargetConfig {
    TARGET = {
        name: 'example',
        url: 'https://example.com',
    };

    URLS = {
        login: 'https://example.com/login',
        start: 'https://example.com/account/subscription',
    };

    SELECTORS = {
        input: {
            username: 'input#email',
            password: 'input#password',
        },
        button: {
            login: '#dssLogin button[type="submit"][name="dssLoginSubmit"]',
            account: 'nav#app_navigation div#account-dropdown a#active-profile div div',
            subscription: '#account_settings_index > div > div > div:nth-child(4) > div:nth-child(2) > div > div > p',
            subscriptions: '#account_settings_index > div > div > div:nth-child(4) > div > div > div > p',
            accountButtons: '#account_settings_index > div > div > div > div > div > div > p',
            cancel: '#account_settings_subscription > div > div > div > div > div > div > p',
            continueCancel: '#account_settings_subscription :text("Cancel Subscription"), #cancel_subscription_survey > div > div > div > button',
            finishCancel: 'button[data-testid="complete-cancellation-button"], #cancel_subscription_recommendations > div > div > div > div > div:nth-child(2) > button',
            dismissOffer: '#cancel_subscription_recommendations button[data-testid="complete-cancellation-button"]',
            restartService: '#section_index button[data-testid="regular-sign-up"]',
            thirdPartyBilling: 'button[data-testid^="external-subscription"]',
        },
        link: {
            account: 'li#dropdown-option_account a',
        },
        paymentMethodExpiry: {
            header: '#app_index > div > div > div > h4',
            button: '#app_index > div > div > div > div > button',
        },
        loginErrorMessage: '#dssLogin > fieldset > span > div',
        priceIncrease: 'div.ab-message-text h1.ab-message-header',
        profileAvatar: 'div.profile-avatar',
        accountButtonLinks: '#account_settings_index > div > div > div > div > span > button',
        loginHeader: '#onboarding_index > div > h3',
        verifyCancel: '#cancel_subscription_success > div > div > div > div > div > p.subscription-cancel-title',
        serviceInactive: 'main#section_index div div div div div p',
        cancelStatusHeader: '#account_settings_subscription > div > div > div > div > div > p, #account_settings_subscription > div > div > div > div > p:nth-child(1), [data-testid="subscription-canceled"]',
        invalidCredentials: 'div.ReactModal__Content > h4',
        emailVerification: '#onboarding_index > div > div > form > p',
        inputError: 'div[data-testid="text-input-error"]',
        serviceExpires: {
            [steps.prepareCancel]: 'div[data-testid="subscription-canceled"] > p:nth-child(2)',
            [steps.verifyCancel]: '#cancel_subscription_success > div > div > div > div > div > p.cancellation-blurb',
        },
    };

    PATTERNS = {
        isAlreadyCancelled: [
            {
                selector: this.SELECTORS.serviceInactive,
                contents: [
                    'Please complete your subscription to start watching',
                ],
            },
            {
                selector: this.SELECTORS.serviceInactive,
                contents: [
                    'Please complete your subscription to start watching',
                ],
            },
            {
                selector: this.SELECTORS.cancelStatusHeader,
                contents: [
                    'subscription is cancel',
                    'subscription has been cancel',
                    'Subscription canceled',
                    'Subscription cancelled',
                    'Se canceló',
                ],
            },
            {
                selector: this.SELECTORS.button.restartService,
                contents: [
                    'RESTART SUBSCRIPTION',
                ],
            },
        ],
        isServiceInactive: [
            {
                selector: this.SELECTORS.serviceInactive,
                contents: [
                    'Please complete your subscription to start watching',
                ],
            },
            {
                selector: this.SELECTORS.serviceInactive,
                contents: [
                    'Please complete your subscription to start watching',
                ],
            },
            {
                selector: this.SELECTORS.cancelStatusHeader,
                contents: [
                    'Subscription canceled',
                    'Subscription cancelled',
                    'Se canceló',
                ],
            },
            {
                selector: this.SELECTORS.button.restartService,
                contents: [
                    'RESTART SUBSCRIPTION',
                ],
            },
        ],
        isThirdPartyBilling: [
            {
                selector: this.SELECTORS.button.thirdPartyBilling,
                contents: [
                    'Manage on',
                ],
            },
        ],
        isNonCancellable: [
            {
                selector: this.SELECTORS.cancelStatusHeader,
                contents: [
                    'Resume Subscription',
                ],
            },
            {
                selector: this.SELECTORS.emailVerification,
                contents: ['We need you to verify your email address'],
            },
            {
                selector: this.SELECTORS.priceIncrease,
                contents: ['Price Increase'],
            },
        ],
        isLoginInvalid: [
            {
                selector: this.SELECTORS.invalidCredentials,
                contents: ['We couldn\'t find an account for that email'],
            },
            {
                selector: this.SELECTORS.inputError,
                contents: ['Incorrect password'],
            },
        ],
        verifyCancelSuccess: [
            {
                selector: this.SELECTORS.verifyCancel,
                contents: [
                    'Your subscription has been cancel',
                    'Se ha cancelado',
                    'Se canceló',
                ],
            },
        ],
        connectionError: [{
            /** @returns {Error} */
            getError: () => new Robot.errors.Network({rotateSession: true}),
            selector: this.SELECTORS.loginErrorMessage,
            contents: ['experiencing slow internet connection'],
        }],
    };

    PREDICATES = {
        user: response =>
            response.request().method() === 'POST'
            && (response.url().includes('bamgrid.com/idp/check') || response.url().includes('bamgrid.com/v1/public/graphql'))
            && response.status() <= 201,
        login: response =>
            response.request().method() === 'POST'
            && (response.url().includes('bamgrid.com/idp/login') || response.url().includes('bamgrid.com/v1/public/graphql'))
            && response.status() <= 401,
    };
}

module.exports = new Config();
