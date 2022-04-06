"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectObject = void 0;
const obj2xml_1 = require("../utils/obj2xml");
const utility_1 = require("utility");
async function selectObject(name, expression, process, options) {
    if (!['json', 'csv'].includes(process.toLocaleLowerCase())) {
        throw new Error('process must be json or csv');
    }
    const opts = Object.assign({}, options);
    opts.subres = `x-oss-process=${process}/select`;
    console.log('expression', expression);
    console.log('opt', opts);
    const needToEncode = ['RecordDelimiter', 'FieldDelimiter', 'QuoteCharacter', 'CommentCharacter'];
    let InputSerialization = {};
    let OutputSerialization = {};
    let Options = {};
    InputSerialization.CompressionType =
        opts.InputSerialization && opts.InputSerialization.CompressionType
            ? opts.InputSerialization.CompressionType
            : 'None';
    if (process.toLocaleLowerCase() === 'csv') {
        //inputSerialization
        if (opts.InputSerialization && opts.InputSerialization.CSV) {
            Object.keys(opts.InputSerialization.CSV).forEach(i => {
                if (needToEncode.includes(i)) {
                    opts.InputSerialization.CSV[i] = utility_1.base64encode(opts.InputSerialization.CSV[i]);
                }
            });
            InputSerialization = Object.assign({}, opts.InputSerialization);
        }
        //OutputSerialization
        if (opts.OutputSerialization && opts.OutputSerialization.CSV) {
            Object.keys(opts.OutputSerialization.CSV).forEach(i => {
                if (needToEncode.includes(i)) {
                    opts.OutputSerialization.CSV[i] = utility_1.base64encode(opts.OutputSerialization.CSV[i]);
                }
            });
            OutputSerialization = Object.assign({}, opts.OutputSerialization);
        }
    }
    if (process.toLowerCase() === 'json' && opts.InputSerialization && opts.InputSerialization.JSON) {
        opts.InputSerialization.JSON = Object.assign({}, opts.inputSerialization);
    }
    //Options
    if (opts.Other) {
        Options = Object.assign({}, opts.Other);
    }
    const paramsXMLObj = {
        SelectRequest: {
            Expression: utility_1.base64encode(expression),
            InputSerialization,
            OutputSerialization,
            Options
        }
    };
    const params = this._objectRequestParams('POST', name, opts);
    params.content = obj2xml_1.obj2xml(paramsXMLObj);
    console.log(params.content);
    // await this.request(params);
}
exports.selectObject = selectObject;
