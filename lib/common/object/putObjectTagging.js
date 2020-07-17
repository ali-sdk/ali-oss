"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putObjectTagging = void 0;
const obj2xml_1 = require("../utils/obj2xml");
const checkObjectTag_1 = require("../utils/checkObjectTag");
const objectName_1 = require("../utils/objectName");
/**
 * putObjectTagging
 * @param {String} name - object name
 * @param {Object} tag -  object tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */
async function putObjectTagging(name, tag, options = {}) {
    checkObjectTag_1.checkObjectTag(tag);
    options.subres = Object.assign({ tagging: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    name = objectName_1.objectName(name);
    const params = this._objectRequestParams('PUT', name, options);
    params.successStatuses = [200];
    tag = Object.keys(tag).map(key => ({
        Key: key,
        Value: tag[key]
    }));
    const paramXMLObj = {
        Tagging: {
            TagSet: {
                Tag: tag
            }
        }
    };
    params.mime = 'xml';
    params.content = obj2xml_1.obj2xml(paramXMLObj);
    const result = await this.request(params);
    return {
        res: result.res,
        status: result.status
    };
}
exports.putObjectTagging = putObjectTagging;
