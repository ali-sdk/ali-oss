"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancel = void 0;
const abortMultipartUpload_1 = require("../../common/multipart/abortMultipartUpload");
/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
function cancel(abort) {
    this.options.cancelFlag = true;
    if (abort) {
        abortMultipartUpload_1.abortMultipartUpload.call(this, abort.name, abort.uploadId, abort.options);
    }
}
exports.cancel = cancel;
