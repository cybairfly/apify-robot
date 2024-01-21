module.exports = {
    secretsDecrypted: {
        isSecretsDecrypted: true,
    },

    // login steps
    loginReady: {
        isLoginReady: true,
    },
    loginFailed: {
        isLoginFailed: true,
    },
    loginSuccess: {
        isLoginSuccess: true,
    },
    validSession: {
        isValidSession: true,
    },

    // process steps
    accountReady: {
        isAccountReady: true,
    },
    targetPrepared: {
        isTargetPrepared: true,
    },
    inputPrompted: {
        isInputPrompted: true,
    },
    inputReceived: {
        isInputReceived: true,
    },
    promptConfirmed: {
        isPromptConfirmed: true,
    },
    processAborted: {
        isProcessAborted: true,
    },
    browserTrusted: {
        isBrowserTrusted: true,
    },
    sessionStored: {
        isSessionStored: true,
    },
    actionComplete: {
        isActionComplete: true,
    },
    resultVerified: {
        isResultVerified: true,
    },

    // edge cases & errors
    loginInvalid: {
        isLoginInvalid: true,
    },
    loginLocked: {
        isLoginLocked: true,
    },
    serviceInactive: {
        isServiceInactive: true,
    },
    knownError: {
        isKnownError: true,
    },
    multiFactor: {
        isMultiFactor: true,
    },
    missingPassword: {
        isMissingPassword: true,
    },
    thirdPartyLogin: {
        isThirdPartyLogin: true,
    },
    userSaved: isUserPersisted => ({
        isUserPersisted,
    }),
    thirdParty: thirdParty => ({
        thirdParty,
    }),
    serviceExpires: date => ({
        serviceAvailableUntil: date,
    }),

    // debug/stats
    proxyIp: proxyIp => ({
        proxyIp,
    }),
};
