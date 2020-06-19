"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOptions = void 0;
const humanize_ms_1 = __importDefault(require("humanize-ms"));
const url_1 = __importDefault(require("url"));
const checkBucketName_1 = require("../utils/checkBucketName");
function setEndpoint(endpoint, secure) {
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
    const protocol = secure ? 'https://' : 'http://';
    let suffix = internal ? '-internal.aliyuncs.com' : '.aliyuncs.com';
    const prefix = 'vpc100-oss-cn-';
    // aliyun VPC region: https://help.aliyun.com/knowledge_detail/38740.html
    if (region.substr(0, prefix.length) === prefix) {
        suffix = '.aliyuncs.com';
    }
    return url_1.default.parse(protocol + region + suffix);
}
function initOptions(options) {
    if (!options
        || !options.accessKeyId
        || !options.accessKeySecret) {
        throw new Error('require accessKeyId, accessKeySecret');
    }
    if (options.bucket) {
        checkBucketName_1.checkBucketName(options.bucket);
    }
    const opts = Object.assign({
        region: 'oss-cn-hangzhou',
        internal: false,
        secure: false,
        timeout: 60000,
        bucket: null,
        endpoint: null,
        cname: false,
        isRequestPay: false,
        sldEnable: false
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
;
