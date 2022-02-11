"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureUrl = void 0;
const utility_1 = __importDefault(require("utility"));
const copy_to_1 = __importDefault(require("copy-to"));
const url_1 = __importDefault(require("url"));
const objectName_1 = require("../../common/utils/objectName");
const getResource_1 = require("../../common/utils/getResource");
const signUtils_1 = require("../../common/utils/signUtils");
const getReqUrl_1 = require("../../common/utils/getReqUrl");
const setSTSToken_1 = require("../../common/utils/setSTSToken");
const isFunction_1 = require("../../common/utils/isFunction");
async function signatureUrl(name, options = {}) {
    name = objectName_1.objectName(name);
    options.method = options.method || 'GET';
    const expires = utility_1.default.timestamp() + (options.expires || 1800);
    const params = {
        bucket: this.options.bucket,
        object: name
    };
    const resource = getResource_1.getResource(params, this.options.headerEncoding);
    if (this.options.stsToken && isFunction_1.isFunction(this.options.refreshSTSToken)) {
        await setSTSToken_1.setSTSToken.call(this);
    }
    if (this.options.stsToken) {
        options['security-token'] = this.options.stsToken;
    }
    const signRes = signUtils_1._signatureForURL(this.options.accessKeySecret, options, resource, expires);
    const url = url_1.default.parse(getReqUrl_1.getReqUrl(params, this.options));
    url.query = {
        OSSAccessKeyId: this.options.accessKeyId,
        Expires: expires,
        Signature: signRes.Signature
    };
    copy_to_1.default(signRes.subResource).to(url.query);
    return url.format();
}
exports.signatureUrl = signatureUrl;
