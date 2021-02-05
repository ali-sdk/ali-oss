"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processObjectSave = void 0;
const querystring_1 = __importDefault(require("querystring"));
const js_base64_1 = require("js-base64");
const checkBucketName_1 = require("../utils/checkBucketName");
const objectName_1 = require("../utils/objectName");
const _objectRequestParams_1 = require("../client/_objectRequestParams");
async function processObjectSave(sourceObject, targetObject, process, targetBucket) {
    checkArgs(sourceObject, 'sourceObject');
    checkArgs(targetObject, 'targetObject');
    checkArgs(process, 'process');
    targetObject = objectName_1.objectName(targetObject);
    if (targetBucket) {
        checkBucketName_1.checkBucketName(targetBucket);
    }
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'POST', sourceObject, {
        subres: 'x-oss-process',
    });
    const bucketParam = targetBucket ? `,b_${js_base64_1.Base64.encode(targetBucket)}` : '';
    targetObject = js_base64_1.Base64.encode(targetObject);
    const content = {
        'x-oss-process': `${process}|sys/saveas,o_${targetObject}${bucketParam}`,
    };
    params.content = querystring_1.default.stringify(content);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.res.status,
    };
}
exports.processObjectSave = processObjectSave;
function checkArgs(name, key) {
    if (!name) {
        throw new Error(`${key} is required`);
    }
    if (typeof name !== 'string') {
        throw new Error(`${key} must be String`);
    }
}
