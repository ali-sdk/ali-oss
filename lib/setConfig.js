"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfig = void 0;
const urllib_1 = __importDefault(require("urllib"));
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
const getUserAgent_1 = require("./common/utils/getUserAgent");
const HttpsAgentKeepalive = agentkeepalive_1.default.HttpsAgent;
const globalHttpAgent = new agentkeepalive_1.default();
const globalHttpsAgent = new HttpsAgentKeepalive();
class Client {
    constructor(options) {
        if (!(this instanceof Client)) {
            return new Client(options);
        }
        if (options && options.inited) {
            this.options = options;
        }
        else {
            // this.options = Client.initOptions(options);
        }
        // support custom agent and urllib client
        if (this.options.urllib) {
            this.urllib = this.options.urllib;
        }
        else {
            this.urllib = urllib_1.default;
            this.agent = this.options.agent || globalHttpAgent;
            this.httpsAgent = this.options.httpsAgent || globalHttpsAgent;
        }
        // this.ctx = ctx;
        this.userAgent = getUserAgent_1.getUserAgent();
    }
}
exports.setConfig = (options) => {
    const client = new Client(options);
    console.log(client);
};
