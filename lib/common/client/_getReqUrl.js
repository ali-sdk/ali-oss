"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._getReqUrl = void 0;
const url_1 = __importDefault(require("url"));
const copy_to_1 = __importDefault(require("copy-to"));
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const isIP_1 = require("../utils/isIP");
const checkValid_1 = require("../utils/checkValid");
const escapeName_1 = require("../utils/escapeName");
const isString_1 = require("../utils/isString");
const isArray_1 = require("../utils/isArray");
function _getReqUrl(params) {
    const ep = {};
    checkValid_1.checkValidEndpoint(this.options.endpoint);
    copy_to_1.default(this.options.endpoint).to(ep);
    const _isIP = isIP_1.isIP(ep.hostname);
    const isCname = this.options.cname;
    if (params.bucket && !isCname && !_isIP && !this.options.sldEnable) {
        ep.host = `${params.bucket}.${ep.host}`;
    }
    let resourcePath = '/';
    if (params.bucket && this.options.sldEnable) {
        resourcePath += `${params.bucket}/`;
    }
    if (params.object) {
        // Preserve '/' in result url
        resourcePath += escapeName_1.escapeName(params.object).replace(/\+/g, '%2B');
    }
    ep.pathname = resourcePath;
    const query = {};
    if (params.query) {
        merge_descriptors_1.default(query, params.query);
    }
    if (params.subres) {
        let subresAsQuery = {};
        if (isString_1.isString(params.subres)) {
            subresAsQuery[params.subres] = '';
        }
        else if (isArray_1.isArray(params.subres)) {
            params.subres.forEach(k => {
                subresAsQuery[k] = '';
            });
        }
        else {
            subresAsQuery = params.subres;
        }
        merge_descriptors_1.default(query, subresAsQuery);
    }
    ep.query = query;
    return url_1.default.format(ep);
}
exports._getReqUrl = _getReqUrl;
