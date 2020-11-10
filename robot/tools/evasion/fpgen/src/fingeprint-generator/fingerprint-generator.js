const userAgents = require('./USER-AGENTS');

class FingerprintGenerator {
    constructor(options = {}) {
        const {
            browser = 'Firefox',
            platform = 'Linux',
            device = 'computer', // can be tablet and mobile
            poolSize = 500,
            browserVersionMin = 69,
        } = options;

        this.poolSize = poolSize;
        this.browser = browser;
        this.browserVersionMin = browserVersionMin;
        this.platfrom = platform;
        this.device = device;

        this._userAgents = userAgents.filter((parsedUa) => parsedUa.user_agent_meta_data.times_seen >= 50);
        this._screenResolutions = [
            // { width: '640', height: '450' },
            // { width: '800', height: '500' },
            // { width: '960', height: '720' },
            // { width: '1024', height: '768' },
            { width: 1280, height: 960 },
            { width: 1400, height: 1050 },
            { width: 1400, height: 1050 },
            { width: 1440, height: 1080 },
            { width: 1600, height: 1200 },
            { width: 1856, height: 1392 },
            { width: 1920, height: 1440 },
            { width: 2048, height: 1536 },
            { width: 1280, height: 800 },
            { width: 1440, height: 900 },
            { width: 1680, height: 1050 },
            { width: 1920, height: 1200 },
            { width: 2560, height: 1600 },
            // { width: 1024, height: 576 },
            { width: 1152, height: 648 },
            { width: 1280, height: 720 },
            { width: 1366, height: 768 },
            { width: 1600, height: 900 },
            { width: 1920, height: 1080 },
            { width: 2560, height: 1440 },
            { width: 3840, height: 2160 },
            // { width: 7680, height: 4320 },
        ];
        this._pixelDepth = [24];
        this._languages = ['en-US'];
        this._graphicCards = {
            Intel: [
                'Intel HD Graphics 3000 OpenGL Engine', 'Intel HD Graphics 4000 OpenGL Engine', 'Intel HD Graphics 5000 OpenGL Engine',
                'Intel Iris OpenGL Engine', 'Intel Iris Pro OpenGL Engine', 'Intel(R) HD Graphics 510', 'Intel(R) HD Graphics 515',
                'Intel(R) HD Graphics 530', 'Intel(R) HD Graphics 5300', 'Intel(R) HD Graphics 6000', 'Intel(R) HD Graphics 630',
                'Intel(R) Iris(TM) Plus Graphics 640',
            ],
            'NVIDIA Corporation': [
                'GeForce GT 740M/PCIe/SSE2', 'GeForce GTX 1050 Ti with Max-Q Design/PCIe/SSE2', 'GeForce GTX 1070/PCIe/SSE2',
                'GeForce GTX 1080 Ti/PCIe/SSE2', 'GeForce GTX 1080/PCIe/SSE2', 'GeForce GTX 550 Ti/PCIe/SSE2', 'GeForce GTX 760/PCIe/SSE2',
                'GeForce GTX 960M/PCIe/SSE2', 'GeForce MX150/PCIe/SSE2',
            ],
            'ATI Technologies Inc': [
                'AMD Radeon HD - FirePro D500 OpenGL Engine', 'AMD Radeon Pro 450 OpenGL Engine', 'AMD Radeon Pro 455 OpenGL Engine',
                'AMD Radeon Pro 460 OpenGL Engine', 'AMD Radeon Pro 555 OpenGL Engine', 'AMD Radeon Pro 555X OpenGL Engine',
                'AMD Radeon Pro 560X OpenGL Engine', 'AMD Radeon R9 M370X OpenGL Engine', 'AMD Radeon R9 M390 OpenGL Engine',
                'AMD Radeon R9 M395X OpenGL Engine', 'AMD Radeon Pro 560 OpenGL Engine',
            ],
        };

        this._batteryLevels = [
            { level: 0.1, chargingTime: 100, dischargingTime: Infinity },
            { level: 0.25, chargingTime: 322, dischargingTime: Infinity },
            { level: 0.5, chargingTime: 2451, dischargingTime: Infinity },
            { level: 0.6, chargingTime: 3521, dischargingTime: Infinity },
            { level: 0.72, chargingTime: 3525, dischargingTime: Infinity },
            { level: 0.81, chargingTime: 3825, dischargingTime: Infinity },
            { level: 0.93, chargingTime: 3829, dischargingTime: Infinity },
            { level: 0.95, chargingTime: 4142, dischargingTime: Infinity },
            { level: 1.0, chargingTime: 23455, dischargingTime: Infinity },
        ];
    }

    createWebgl() {
        const vendor = this._pickRandomElementArray(Object.keys(this._graphicCards));
        const renderer = this._pickRandomElementArray(this._graphicCards[vendor]);

        return { vendor, renderer };
    }

    createScreenProperties() {
        const { width, height } = this._pickRandomElementArray(this._screenResolutions);
        const depth = this._pickRandomElementArray(this._pixelDepth);

        const hasSideBar = Math.random() > 0.2;
        let availLeft;
        let availTop;

        if (hasSideBar) {
            availLeft = 65;
            availTop = 24;
        } else {
            availLeft = 0;
            availTop = 23;
        }

        return {
            availHeight: height - availTop,
            availWidth: width - availLeft,
            availLeft,
            availTop,
            colorDepth: depth,
            height,
            width,
            pixelDepth: depth,
            left: 0,
            top: 0,
        };
    }

    createNavigatorAttributes(parsedUA, language) {
        return {
            userAgent: parsedUA.user_agent,
            cookieEnabled: this._pickRandomElementArray([true, false]),
            doNotTrack: this._pickRandomElementArray(['1', '0', 'unspecified']),
            language,
            languages: [this._pickRandomElementArray(this._languages)],
            platform: 'Linux x86_64',
        };
    }

    createBattery() {
        const isCharging = this._pickRandomElementArray([true, false]);
        let batteryInfo;

        if (isCharging) {
            batteryInfo = this._pickRandomElementArray(this._batteryLevels);
        }

        return {
            charging: isCharging,
            chargingTime: isCharging ? batteryInfo.chargingTime : 0,
            dischargingTime: Infinity,
            level: batteryInfo && batteryInfo.level,
        };
    }

    async createFingerprint() {
        const userAgentBase = this._pickRandomElementArray(this._userAgents);
        const language = this._pickRandomElementArray(this._languages);
        const screen = this.createScreenProperties();
        const navigator = this.createNavigatorAttributes(userAgentBase, language);
        const webGl = this.createWebgl();
        const batteryInfo = this.createBattery();
        const historyLength = this._pickRandomElementArray([3, 4, 5, 6, 7]);

        return {
            userAgent: userAgentBase.user_agent,
            screen,
            navigator,
            webGl,
            batteryInfo,
            language,
            historyLength,
        };
    }

    _pickRandomElementArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
}

module.exports = FingerprintGenerator;
