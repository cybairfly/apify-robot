module.exports = {
    // login steps
    loginReady: {
        isLoginReady: true,
    },
    loginFailed: {
        isLoginSuccess: false,
    },
    loginSuccess: {
        isLoginSuccess: true,
    },
    validSession: {
        isValidSession: true,
    },
    invalidSession: {
        isInvalidSession: true,
    },

    // action steps
    accountReady: {
        isAccountReady: true,
    },
    actionPrepared: {
        isCancelPrepared: true,
    },
    actionPrompted: {
        isCancelPrompted: true,
    },
    actionApproved: {
        isCancelApproved: true,
    },
    actionAborted: {
        isCancelAborted: true,
    },
    actionComplete: {
        isCancelComplete: true,
    },
    actionVerified: {
        isCancelVerified: true,
    },

    // edge cases & errors
    isLoginInvalid: {
        isLoginInvalid: true,
    },
    isAlreadyCancelled: {
        isAlreadyCancelled: true,
    },
    isServiceInactive: {
        isServiceInactive: true,
    },
    isFreeAccount: {
        isFreeAccount: true,
    },
    isIneligible: {
        isIneligible: true,
    },
    isKnownError: {
        isKnownError: true,
    },
    isMFA: {
        isMFA: true,
    },
    isMissingPassword: {
        isMissingPassword: true,
    },
    isOnHold: {
        isOnHold: true,
    },
    isNonCancellable: {
        isNonCancellable: true,
    },
    isThirdPartyBilling: {
        isThirdPartyBilling: true,
    },
    isThirdPartyLogin: {
        isThirdPartyLogin: true,
    },
    isRefundRequestFailed: {
        isRefundRequestSuccess: false,
    },
    isRefundRequestSuccess: {
        isRefundRequestSuccess: true,
    },
    isTermsAgreement: {
        isTermsAgreement: true,
        isNonCancellable: true,
    },
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
