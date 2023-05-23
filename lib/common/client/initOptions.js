"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOptions = exports.setRegion = void 0;
const humanize_ms_1 = __importDefault(require("humanize-ms"));
const url_1 = __importDefault(require("url"));
const checkBucketName_1 = require("../utils/checkBucketName");
const checkValid_1 = require("../utils/checkValid");
function setEndpoint(endpoint, secure) {
    checkValid_1.checkValidEndpoint(endpoint);
    let url = url_1.default.parse(endpoint);
    if (!url.protocol) {
        url = url_1.default.parse(`http${secure ? 's' : ''}://${endpoint}`);
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Endpoint protocol must be http or https.');
    }
    return url;
}
function setRegion(region, internal, secure) {
    checkValid_1.checkValidRegion(region);
    const protocol = secure ? 'https://' : 'http://';
    let suffix = internal ? '-internal.aliyuncs.com' : '.aliyuncs.com';
    const prefix = 'vpc100-oss-cn-';
    // aliyun VPC region: https://help.aliyun.com/knowledge_detail/38740.html
    if (region.substr(0, prefix.length) === prefix) {
        suffix = '.aliyuncs.com';
    }
    return url_1.default.parse(protocol + region + suffix);
}
exports.setRegion = setRegion;
// check local web protocol,if https secure default set true , if http secure default set false
function isHttpsWebProtocol() {
    let secure = false;
    try {
        secure = location && location.protocol === 'https:';
        // eslint-disable-next-line no-empty
    }
    catch (error) { }
    return secure;
}
function initOptions(options) {
    if (!options || !options.accessKeyId || !options.accessKeySecret) {
        throw new Error('require accessKeyId, accessKeySecret');
    }
    if (options.stsToken && !options.refreshSTSToken && !options.refreshSTSTokenInterval) {
        console.warn("It's recommended to set 'refreshSTSToken' and 'refreshSTSTokenInterval' to refresh stsToken、accessKeyId、accessKeySecret automatically when sts info expires");
    }
    if (options.bucket) {
        checkBucketName_1.checkBucketName(options.bucket);
    }
    const opts = Object.assign({
        region: 'oss-cn-hangzhou',
        internal: false,
        secure: isHttpsWebProtocol(),
        timeout: 60000,
        bucket: null,
        endpoint: null,
        cname: false,
        isRequestPay: false,
        sldEnable: false,
        useFetch: false,
        headerEncoding: 'utf-8',
        refreshSTSTokenInterval: 60000 * 5,
        refreshSTSToken: null,
        enableProxy: false,
        proxy: null,
        disabledMD5: false
    }, options);
    opts.accessKeyId = opts.accessKeyId.trim();
    opts.accessKeySecret = opts.accessKeySecret.trim();
    if (opts.timeout) {
        opts.timeout = humanize_ms_1.default(opts.timeout);
    }
    if (opts.endpoint) {
        opts.endpoint = setEndpoint(opts.endpoint, opts.secure);
    }
    else if (opts.region) {
        opts.endpoint = setRegion(opts.region, opts.internal, opts.secure);
    }
    else {
        throw new Error('require options.endpoint or options.region');
    }
    opts.inited = true;
    return opts;
}
exports.initOptions = initOptions;
