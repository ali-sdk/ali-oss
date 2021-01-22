"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMulti = void 0;
/* eslint-disable object-curly-newline */
const utility_1 = __importDefault(require("utility"));
const obj2xml_1 = require("../utils/obj2xml");
const objectName_1 = require("../utils/objectName");
async function deleteMulti(names, options = {}) {
    const objects = [];
    if (!names || !names.length) {
        throw new Error('names is required');
    }
    for (let i = 0; i < names.length; i++) {
        const object = {};
        const data = names[i];
        if (typeof (data) === 'string') {
            object.Key = utility_1.default.escape(objectName_1.objectName(data));
        }
        else {
            const { key, versionId } = data;
            object.Key = utility_1.default.escape(objectName_1.objectName(key));
            object.VersionId = versionId;
        }
        objects.push(object);
    }
    const paramXMLObj = {
        Delete: {
            Quiet: !!options.quiet,
            Object: objects,
        },
    };
    const paramXML = obj2xml_1.obj2xml(paramXMLObj, {
        headers: true,
    });
    options.subres = Object.assign({ delete: '' }, options.subres);
    const params = this._objectRequestParams('POST', '', options);
    params.mime = 'xml';
    params.content = paramXML;
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    const r = result.data;
    let deleted = (r && r.Deleted) || null;
    if (deleted) {
        if (!Array.isArray(deleted)) {
            deleted = [deleted];
        }
    }
    return {
        res: result.res,
        deleted: deleted || [],
    };
}
exports.deleteMulti = deleteMulti;
