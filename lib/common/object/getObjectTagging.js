"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjectTagging = void 0;
const objectName_1 = require("../utils/objectName");
const objectRequestParams_1 = require("../utils/objectRequestParams");
const formatTag_1 = require("../utils/formatTag");
const parseXML_1 = require("../utils/parseXML");
/**
 * getObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 * @return {Object}
 */
async function getObjectTagging(name, options = {}) {
    options.subres = Object.assign({ tagging: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    name = objectName_1.objectName(name);
    const params = objectRequestParams_1.objectRequestParams('GET', name, this.options.bucket, options);
    params.successStatuses = [200];
    const result = await this.request(params);
    const Tagging = await parseXML_1.parseXML(result.data);
    return {
        status: result.status,
        res: result.res,
        tag: formatTag_1.formatTag(Tagging)
    };
}
exports.getObjectTagging = getObjectTagging;
;
