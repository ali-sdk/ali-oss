"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestError = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('ali-oss');
async function requestError(result) {
    let err = null;
    if (!result.data || !result.data.length) {
        if (result.status === -1 || result.status === -2) { // -1 is net error , -2 is timeout
            err = new Error(result.message);
            err.name = result.name;
            err.status = result.status;
            err.code = result.name;
        }
        else {
            // HEAD not exists resource
            if (result.status === 404) {
                err = new Error('Object not exists');
                err.name = 'NoSuchKeyError';
                err.status = 404;
                err.code = 'NoSuchKey';
            }
            else if (result.status === 412) {
                err = new Error('Pre condition failed');
                err.name = 'PreconditionFailedError';
                err.status = 412;
                err.code = 'PreconditionFailed';
            }
            else {
                err = new Error(`Unknow error, status: ${result.status}`);
                err.name = 'UnknowError';
                err.status = result.status;
            }
            err.requestId = result.headers['x-oss-request-id'];
            err.host = '';
        }
    }
    else {
        const message = String(result.data);
        debug('request response error data: %s', message);
        let info;
        try {
            info = await this.parseXML(message) || {};
        }
        catch (error) {
            debug(message);
            error.message += `\nraw xml: ${message}`;
            error.status = result.status;
            error.requestId = result.headers['x-oss-request-id'];
            return error;
        }
        let msg = info.Message || (`unknow request error, status: ${result.status}`);
        if (info.Condition) {
            msg += ` (condition: ${info.Condition})`;
        }
        err = new Error(msg);
        err.name = info.Code ? `${info.Code}Error` : 'UnknowError';
        err.status = result.status;
        err.code = info.Code;
        err.requestId = info.RequestId;
        err.hostId = info.HostId;
    }
    debug('generate error %j', err);
    return err;
}
exports.requestError = requestError;
;
