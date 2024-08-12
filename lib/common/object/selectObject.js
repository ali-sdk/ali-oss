"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectObject = void 0;
const obj2xml_1 = require("../utils/obj2xml");
const js_base64_1 = require("js-base64");
const unpackFrame_1 = __importDefault(require("../utils/unpackFrame"));
const needToEncode = ['RecordDelimiter', 'FieldDelimiter', 'QuoteCharacter', 'CommentCharacter'];
async function selectObject(name, expression, grammar, options) {
    if (!['json', 'csv'].includes(grammar.toLocaleLowerCase())) {
        throw new Error('grammar must be json or csv');
    }
    const opts = Object.assign({}, options);
    opts.subres = Object.assign({ 'x-oss-process': `${grammar}/select` });
    let InputSerialization;
    let OutputSerialization;
    let Options;
    const paramsXMLObj = {
        SelectRequest: {
            Expression: js_base64_1.Base64.encode(expression)
        }
    };
    // CompressionType
    if (opts.InputSerialization) {
        opts.InputSerialization.CompressionType = opts.InputSerialization.CompressionType
            ? opts.InputSerialization.CompressionType
            : 'None';
    }
    // CSV
    if (grammar.toLocaleLowerCase() === 'csv') {
        // inputSerialization
        if (opts.InputSerialization && opts.InputSerialization.CSV) {
            Object.keys(opts.InputSerialization.CSV).forEach(i => {
                if (needToEncode.includes(i)) {
                    opts.InputSerialization.CSV[i] = js_base64_1.Base64.encode(opts.InputSerialization.CSV[i]);
                }
            });
        }
        InputSerialization = Object.assign({}, opts.InputSerialization);
        paramsXMLObj.SelectRequest.InputSerialization = InputSerialization;
        // OutputSerialization
        if (opts.OutputSerialization && opts.OutputSerialization.CSV) {
            Object.keys(opts.OutputSerialization.CSV).forEach(i => {
                if (needToEncode.includes(i)) {
                    opts.OutputSerialization.CSV[i] = js_base64_1.Base64.encode(opts.OutputSerialization.CSV[i]);
                }
            });
        }
        OutputSerialization = Object.assign({}, opts.OutputSerialization);
        paramsXMLObj.SelectRequest.OutputSerialization = OutputSerialization;
    }
    // JSON
    if (grammar.toLowerCase() === 'json') {
        // InputSerialization
        if (opts.InputSerialization && opts.InputSerialization.JSON) {
            opts.InputSerialization.JSON.Type = opts.InputSerialization.JSON.Type
                ? opts.InputSerialization.JSON.Type.toUpperCase()
                : 'DOCUMENT';
            opts.InputSerialization.JSON = Object.assign({}, opts.InputSerialization.JSON);
        }
        InputSerialization = Object.assign({}, opts.InputSerialization);
        paramsXMLObj.SelectRequest.InputSerialization = InputSerialization;
        // OutputSerialization
        if (opts.OutputSerialization && opts.OutputSerialization.JSON) {
            if (opts.OutputSerialization.JSON.RecordDelimiter) {
                opts.OutputSerialization.JSON.RecordDelimiter = js_base64_1.Base64.encode(opts.OutputSerialization.JSON.RecordDelimiter);
            }
        }
        OutputSerialization = Object.assign({}, opts.OutputSerialization);
        paramsXMLObj.SelectRequest.OutputSerialization = OutputSerialization;
    }
    // Options
    if (opts.Other) {
        Options = Object.assign({}, opts.Other);
        paramsXMLObj.SelectRequest.Options = Options;
    }
    const params = this._objectRequestParams('POST', name, opts);
    params.content = obj2xml_1.obj2xml(paramsXMLObj);
    params.mime = 'xml';
    params.successStatuses = [206];
    const result = await this.request(params);
    if (result.res.headers['x-oss-select-output-raw'] !== 'true') {
        result.data = unpackFrame_1.default(result.data);
    }
    else {
        result.data = result.data.toString();
    }
    return {
        res: result.res,
        data: result.data
    };
}
exports.selectObject = selectObject;
