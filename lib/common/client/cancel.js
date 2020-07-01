"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancel = void 0;
const abortMultipartUpload_1 = require("../multipart/abortMultipartUpload");
const isArray_1 = require("../utils/isArray");
/**
 * cancel operation, now can use with multipartUpload
 * @param {Object} abort
 *        {String} anort.name object key
 *        {String} anort.uploadId upload id
 *        {String} anort.options timeout
 */
function cancel(abort) {
    this.options.cancelFlag = true;
    if (isArray_1.isArray(this.multipartUploadStreams)) {
        this.multipartUploadStreams.forEach(_ => {
            if (_.destroyed === false) {
                const err = {
                    name: 'cancel',
                    message: 'multipartUpload cancel'
                };
                _.destroy(err);
            }
        });
    }
    this.multipartUploadStreams = [];
    if (abort) {
        abortMultipartUpload_1.abortMultipartUpload.call(this, abort.name, abort.uploadId, abort.options);
    }
}
exports.cancel = cancel;
;
