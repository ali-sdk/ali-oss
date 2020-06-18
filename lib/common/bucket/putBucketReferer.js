"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketReferer = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
async function putBucketReferer(name, allowEmpty, referers, options = {}) {
    checkBucketName_1.checkBucketName(name);
    const params = this._bucketRequestParams('PUT', name, 'referer', options);
    const parseXMLObj = {
        RefererConfiguration: {
            AllowEmptyReferer: allowEmpty ? 'true' : 'false',
            RefererList: referers && referers.length > 0 ?
                {
                    Referer: referers
                } :
                ''
        }
    };
    params.content = obj2xml_1.obj2xml(parseXMLObj);
    params.mime = 'xml';
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res
    };
}
exports.putBucketReferer = putBucketReferer;
;
