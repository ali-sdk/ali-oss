"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectObject = void 0;
const obj2xml_1 = require("../utils/obj2xml");
const utility_1 = require("utility");
const needToEncode = ['RecordDelimiter', 'FieldDelimiter', 'QuoteCharacter', 'CommentCharacter'];
async function selectObject(name, expression, process, options) {
    if (!['json', 'csv'].includes(process.toLocaleLowerCase())) {
        throw new Error('process must be json or csv');
    }
    const opts = Object.assign({}, options);
    opts.subres = Object.assign({ 'x-oss-process': `${process}/select` });
    let InputSerialization;
    let OutputSerialization;
    let Options;
    const paramsXMLObj = {
        SelectRequest: {
            Expression: utility_1.base64encode(expression)
        }
    };
    // CompressionType
    if (opts.InputSerialization) {
        opts.InputSerialization.CompressionType = opts.InputSerialization.CompressionType
            ? opts.InputSerialization.CompressionType
            : 'None';
    }
    // CSV
    if (process.toLocaleLowerCase() === 'csv') {
        // inputSerialization
        if (opts.InputSerialization && opts.InputSerialization.CSV) {
            Object.keys(opts.InputSerialization.CSV).forEach(i => {
                if (needToEncode.includes(i)) {
                    opts.InputSerialization.CSV[i] = utility_1.base64encode(opts.InputSerialization.CSV[i]);
                }
            });
        }
        InputSerialization = Object.assign({}, opts.InputSerialization);
        paramsXMLObj.SelectRequest.InputSerialization = InputSerialization;
        // OutputSerialization
        if (opts.OutputSerialization && opts.OutputSerialization.CSV) {
            Object.keys(opts.OutputSerialization.CSV).forEach(i => {
                if (needToEncode.includes(i)) {
                    opts.OutputSerialization.CSV[i] = utility_1.base64encode(opts.OutputSerialization.CSV[i]);
                }
            });
        }
        OutputSerialization = Object.assign({}, opts.OutputSerialization);
        paramsXMLObj.SelectRequest.OutputSerialization = OutputSerialization;
    }
    // JSON
    if (process.toLowerCase() === 'json') {
        // InputSerialization
        if (opts.InputSerialization && opts.InputSerialization.JSON) {
            opts.InputSerialization.JSON.Type = opts.InputSerialization.JSON.Type
                ? opts.InputSerialization.JSON.Type.toUpperCase()
                : 'DOCUMENT';
            opts.InputSerialization.JSON = Object.assign({}, opts.inputSerialization.JSON);
        }
        InputSerialization = Object.assign({}, opts.InputSerialization);
        paramsXMLObj.SelectRequest.InputSerialization = InputSerialization;
        // OutputSerialization
        if (opts.OutputSerialization && opts.OutputSerialization.JSON) {
            if (opts.OutputSerialization.JSON.RecordDelimiter) {
                opts.OutputSerialization.JSON.RecordDelimiter = utility_1.base64encode(opts.OutputSerialization.JSON.RecordDelimiter);
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
    // const version = result.data.slice(0, 1);
    // const frameType = result.data.slice(1, 4);
    // const payload = result.data.slice(4, 8);
    console.log(result.data.slice(20, result.data.length - 42).toString());
    return result.data;
}
exports.selectObject = selectObject;
