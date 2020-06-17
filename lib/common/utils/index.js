"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authorization_1 = require("./authorization");
const checkBucketName_1 = require("./checkBucketName");
const checkBucketTag_1 = require("./checkBucketTag");
const checkObjectTag_1 = require("./checkObjectTag");
const checkUserAgent_1 = require("./checkUserAgent");
const checkValid_1 = require("./checkValid");
const convertMetaToHeaders_1 = require("./convertMetaToHeaders");
const deepCopy_1 = require("./deepCopy");
const deleteFileSafe_1 = require("./deleteFileSafe");
const divideParts_1 = require("./divideParts");
const encodeCallback_1 = require("./encodeCallback");
const escapeName_1 = require("./escapeName");
const formatObjKey_1 = require("./formatObjKey");
const formatQuery_1 = require("./formatQuery");
const formatTag_1 = require("./formatTag");
const getPartSize_1 = require("./getPartSize");
const getReqUrl_1 = require("./getReqUrl");
const getResource_1 = require("./getResource");
const getSourceName_1 = require("./getSourceName");
const getStrBytesCount_1 = require("./getStrBytesCount");
const getUserAgent_1 = require("./getUserAgent");
const isArray_1 = require("./isArray");
const isBlob_1 = require("./isBlob");
const isFile_1 = require("./isFile");
const isIP_1 = require("./isIP");
const isObject_1 = require("./isObject");
const mergeDefault_1 = require("./mergeDefault");
const obj2xml_1 = require("./obj2xml");
const objectName_1 = require("./objectName");
const objectUrl_1 = require("./objectUrl");
const parseXML_1 = require("./parseXML");
const policy2Str_1 = require("./policy2Str");
const signUtils_1 = __importDefault(require("./signUtils"));
const webFileReadStream_1 = require("./webFileReadStream");
exports.default = {
    authorization: authorization_1.authorization,
    checkBucketName: checkBucketName_1.checkBucketName,
    checkBucketTag: checkBucketTag_1.checkBucketTag,
    checkObjectTag: checkObjectTag_1.checkObjectTag,
    checkUserAgent: checkUserAgent_1.checkUserAgent,
    checkValid: checkValid_1.checkValid,
    convertMetaToHeaders: convertMetaToHeaders_1.convertMetaToHeaders,
    deepCopy: deepCopy_1.deepCopy,
    deleteFileSafe: deleteFileSafe_1.deleteFileSafe,
    divideParts: divideParts_1.divideParts,
    encodeCallback: encodeCallback_1.encodeCallback,
    escapeName: escapeName_1.escapeName,
    formatObjKey: formatObjKey_1.formatObjKey,
    formatQuery: formatQuery_1.formatQuery,
    formatTag: formatTag_1.formatTag,
    getPartSize: getPartSize_1.getPartSize,
    getReqUrl: getReqUrl_1.getReqUrl,
    getResource: getResource_1.getResource,
    getSourceName: getSourceName_1.getSourceName,
    getStrBytesCount: getStrBytesCount_1.getStrBytesCount,
    getUserAgent: getUserAgent_1.getUserAgent,
    isArray: isArray_1.isArray,
    isBlob: isBlob_1.isBlob,
    isFile: isFile_1.isFile,
    isIP: isIP_1.isIP,
    isObject: isObject_1.isObject,
    mergeDefault: mergeDefault_1.mergeDefault,
    obj2xml: obj2xml_1.obj2xml,
    objectName: objectName_1.objectName,
    _objectName: objectName_1.objectName,
    objectUrl: objectUrl_1.objectUrl,
    parseXML: parseXML_1.parseXML,
    policy2Str: policy2Str_1.policy2Str,
    signUtils: signUtils_1.default,
    WebFileReadStream: webFileReadStream_1.WebFileReadStream
};
