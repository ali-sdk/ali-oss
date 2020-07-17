"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._getReqUrl = void 0;
const url_1 = __importDefault(require("url"));
const copy_to_1 = __importDefault(require("copy-to"));
const merge_descriptors_1 = __importDefault(require("merge-descriptors"));
const is_type_of_1 = __importDefault(require("is-type-of"));
const isIP_1 = require("../utils/isIP");
const escapeName_1 = require("../utils/escapeName");
function _getReqUrl(params) {
    const _escape = this._escape || escapeName_1.escapeName;
    const ep = {};
    copy_to_1.default(this.options.endpoint).to(ep);
    const _isIP = isIP_1.isIP(ep.hostname);
    const isCname = this.options.cname;
    if (params.bucket && !isCname && !_isIP && !this.options.sldEnable) {
        ep.host = `${params.bucket}.${ep.host}`;
    }
    let resourcePath = '/';
    if (params.bucket && (this.options.sldEnable || _isIP)) {
        resourcePath += `${params.bucket}/`;
    }
    if (params.object) {
        // Preserve '/' in result url
        resourcePath += _escape(params.object).replace(/\+/g, '%2B');
    }
    ep.pathname = resourcePath;
    const query = {};
    if (params.query) {
        merge_descriptors_1.default(query, params.query);
    }
    if (params.subres) {
        let subresAsQuery = {};
        if (is_type_of_1.default.string(params.subres)) {
            subresAsQuery[params.subres] = '';
        }
        else if (is_type_of_1.default.array(params.subres)) {
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
