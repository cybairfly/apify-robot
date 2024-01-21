class Config {
    TARGET = {
        name: 'apple',
        url: 'https://apple.com',
    };

    URLS = {
        // login: 'https://appleid.apple.com',
        // login: 'https://www.ipify.org',
        login: 'https://appstoreconnect.apple.com',
        // login: 'https://appstoreconnect.apple.com/login',
    };

    STRINGS = {
        invalidLogin: 'password was incorrect',
        invalidCode: 'Incorrect verification code',
        phoneLocked: 'Too many verification codes have been sent',
        loginLocked: 'incorrect verification code too many times',
    };

    SELECTORS = {
        frame: {
            auth: '#aid-auth-widget-iFrame',
        },
        anchor: {
            login: 'a[title="Sign In"]',
            logout: 'a[title="Sign Out"], a[href="/logout"]',
            resetPhone: 'button#use-diff-ph',
            otherOptions: 'button#other-opts',
            makeCodeCall: 'button#try-again-link',
            sendCodeText: 'button#sms-me-link',
        },
        input: {
            username: 'input#account_name_text_field',
            password: 'input#password_text_field',
            remember: 'input#remember-me',
            otpCode: 'div.security-code input#char0',
        },
        button: {
            login: 'button#sign-in',
            trust: 'button[id^="trust-browser"]:not([id*="dont"])',
            phone: 'phones div[phone-id]',
        },
        phones: 'phones .phones-list',
        phoneNumber: 'phones div[phone-id] .si-phone-name',
        homePage: '#homepage-container',
    };

    PATTERNS = {
        isLoginInvalid: [
            {
                selector: this.SELECTORS.inputError,
                contents: ['Incorrect password'],
            },
        ],
        verifySuccess: [
            {
                selector: this.SELECTORS.verifySuccess,
                contents: [],
            },
        ],
        // TODO support for error patterns
        connectionError: [{
            /** @returns {Error} */
            getError: () => new Robot.errors.Network({rotateSession: true}),
            selector: this.SELECTORS.loginErrorMessage,
            contents: ['experiencing slow internet connection'],
        }],
    };

    PREDICATES = {
        user: response =>
            response.request().method() === 'POST' &&
            (response.url().includes('appleauth/auth/federate')) &&
            response.status() === 200,
        login: response =>
            response.request().method() === 'POST' &&
            (response.url().includes('appleauth/auth/signin')) &&
            response.status() <= 409,
        phone: response =>
            response.request().method() === 'PUT' &&
            (response.url().includes('appleauth/auth/verify/phone')) &&
            response.status() <= 423,
        factor: response =>
            response.request().method() === 'POST' &&
            (response.url().includes('appleauth/auth/verify/phone/securitycode')) &&
            response.status() <= 423,
    };
}

module.exports = new Config();
