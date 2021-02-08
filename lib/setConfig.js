"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.initClient = void 0;
const urllib_1 = __importDefault(require("urllib"));
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
const _getUserAgent_1 = require("./common/client/_getUserAgent");
const initOptions_1 = require("./common/client/initOptions");
const request_1 = require("./common/client/request");
const requestError_1 = require("./common/client/requestError");
const HttpsAgentKeepalive = agentkeepalive_1.default.HttpsAgent;
const globalHttpAgent = new agentkeepalive_1.default();
const globalHttpsAgent = new HttpsAgentKeepalive();
class Client {
    constructor(options, ctx) {
        this._setOptions = 0;
        this.request = request_1.request;
        this.requestError = requestError_1.requestError;
        this.setConfig(options, ctx);
    }
    static use(name, fn) {
        if (!this.prototype[name]) {
            this.prototype[name] = fn;
        }
        else {
            console.warn(`ali-oss: ${name} has been registed`);
        }
        return this;
    }
    setConfig(options, ctx) {
        if (options && options.inited) {
            this.options = options;
        }
        else {
            this.options = initOptions_1.initOptions(options);
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
        this.ctx = ctx;
        this.userAgent = _getUserAgent_1._getUserAgent();
    }
}
exports.Client = Client;
exports.initClient = (options, ctx) => {
    return new Client(options, ctx);
};
