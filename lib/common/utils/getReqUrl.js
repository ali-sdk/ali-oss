"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReqUrl = void 0;
const copy_to_1 = __importDefault(require("copy-to"));
const url_1 = __importDefault(require("url"));
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const isIP_1 = require("./isIP");
const escapeName_1 = require("./escapeName");
const checkValid_1 = require("./checkValid");
const isString_1 = require("./isString");
const isArray_1 = require("./isArray");
function getReqUrl(params, options) {
    const ep = {};
    checkValid_1.checkValidEndpoint(options.endpoint);
    copy_to_1.default(options.endpoint, false).to(ep);
    const _isIP = isIP_1.isIP(ep.hostname);
    const isCname = options.cname;
    if (params.bucket && !isCname && !_isIP && !options.sldEnable) {
        ep.host = `${params.bucket}.${ep.host}`;
    }
    let resourcePath = '/';
    if (params.bucket && options.sldEnable) {
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
            params.subres.forEach((k) => {
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
exports.getReqUrl = getReqUrl;
