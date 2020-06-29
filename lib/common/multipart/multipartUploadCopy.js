"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._divideMultipartCopyParts = exports._resumeMultipartCopy = exports.multipartUploadCopy = void 0;
const _getObjectMeta_1 = require("../utils/_getObjectMeta");
const initMultipartUpload_1 = require("./initMultipartUpload");
const getPartSize_1 = require("../utils/getPartSize");
const copy_to_1 = __importDefault(require("copy-to"));
const debug_1 = __importDefault(require("debug"));
const _makeCancelEvent_1 = require("../utils/_makeCancelEvent");
const _parallel_1 = require("../utils/_parallel");
const debug = debug_1.default('ali-oss:multipart-copy');
/**
 * @param {String} name copy object name
 * @param {Object} sourceData
 *        {String} sourceData.sourceKey  the source object name
 *        {String} sourceData.sourceBucketName  the source bucket name
 *        {Number} sourceData.startOffset  data copy start byte offset, e.g: 0
 *        {Number} sourceData.endOffset  data copy end byte offset, e.g: 102400
 * @param {Object} options
 *        {Number} options.partSize
 */
async function multipartUploadCopy(name, sourceData, options = {}) {
    this.resetCancelFlag();
    const { versionId = null } = options;
    const metaOpt = {
        versionId
    };
    const objectMeta = await _getObjectMeta_1._getObjectMeta.call(this, sourceData.sourceBucketName, sourceData.sourceKey, metaOpt);
    const fileSize = objectMeta.res.headers['content-length'];
    sourceData.startOffset = sourceData.startOffset || 0;
    sourceData.endOffset = sourceData.endOffset || fileSize;
    if (options.checkpoint && options.checkpoint.uploadId) {
        return await _resumeMultipartCopy.call(this, options.checkpoint, sourceData, options);
    }
    const minPartSize = 100 * 1024;
    const copySize = sourceData.endOffset - sourceData.startOffset;
    if (copySize < minPartSize) {
        throw new Error(`copySize must not be smaller than ${minPartSize}`);
    }
    if (options.partSize && options.partSize < minPartSize) {
        throw new Error(`partSize must not be smaller than ${minPartSize}`);
    }
    const init = await initMultipartUpload_1.initMultipartUpload.call(this, name, options);
    const { uploadId } = init;
    const partSize = getPartSize_1.getPartSize(copySize, options.partSize);
    const checkpoint = {
        name,
        copySize,
        partSize,
        uploadId,
        doneParts: []
    };
    if (options && options.progress) {
        await options.progress(0, checkpoint, init.res);
    }
    return await _resumeMultipartCopy.call(this, checkpoint, sourceData, options);
}
exports.multipartUploadCopy = multipartUploadCopy;
;
/*
 * Resume multipart copy from checkpoint. The checkpoint will be
 * updated after each successful part copy.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
async function _resumeMultipartCopy(checkpoint, sourceData, options) {
    if (this.isCancel()) {
        throw _makeCancelEvent_1._makeCancelEvent();
    }
    const { versionId = null } = options;
    const metaOpt = {
        versionId
    };
    const { copySize, partSize, uploadId, doneParts, name } = checkpoint;
    const partOffs = _divideMultipartCopyParts(copySize, partSize, sourceData.startOffset);
    const numParts = partOffs.length;
    const uploadPartCopyOptions = {
        headers: {}
    };
    if (options.copyheaders) {
        copy_to_1.default(options.copyheaders).to(uploadPartCopyOptions.headers);
    }
    if (versionId) {
        copy_to_1.default(metaOpt).to(uploadPartCopyOptions);
    }
    const uploadPartJob = function uploadPartJob(self, partNo, source) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!self.isCancel()) {
                    const pi = partOffs[partNo - 1];
                    const range = `${pi.start}-${pi.end - 1}`;
                    const result = await self.uploadPartCopy(name, uploadId, partNo, range, source, uploadPartCopyOptions);
                    if (!self.isCancel()) {
                        debug(`content-range ${result.res.headers['content-range']}`);
                        doneParts.push({
                            number: partNo,
                            etag: result.res.headers.etag
                        });
                        checkpoint.doneParts = doneParts;
                        if (options && options.progress) {
                            await options.progress(doneParts.length / numParts, checkpoint, result.res);
                        }
                    }
                }
                resolve();
            }
            catch (err) {
                err.partNum = partNo;
                reject(err);
            }
        });
    };
    const all = Array.from(new Array(numParts), (_x, i) => i + 1);
    const done = doneParts.map(p => p.number);
    const todo = all.filter(p => done.indexOf(p) < 0);
    const defaultParallel = 5;
    const parallel = options.parallel || defaultParallel;
    if (this.checkBrowserAndVersion('Internet Explorer', '10') || parallel === 1) {
        for (let i = 0; i < todo.length; i++) {
            if (this.isCancel()) {
                throw _makeCancelEvent_1._makeCancelEvent();
            }
            /* eslint no-await-in-loop: [0] */
            await uploadPartJob(this, todo[i], sourceData);
        }
    }
    else {
        // upload in parallel
        const errors = await _parallel_1._parallel.call(this, todo, parallel, uploadPartJob, sourceData);
        if (this.isCancel()) {
            throw _makeCancelEvent_1._makeCancelEvent();
        }
        // check errors after all jobs are completed
        if (errors && errors.length > 0) {
            const err = errors[0];
            err.message = `Failed to copy some parts with error: ${err.toString()} part_num: ${err.partNum}`;
            throw err;
        }
    }
    return await this.completeMultipartUpload(name, uploadId, doneParts, options);
}
exports._resumeMultipartCopy = _resumeMultipartCopy;
;
function _divideMultipartCopyParts(fileSize, partSize, startOffset) {
    const numParts = Math.ceil(fileSize / partSize);
    const partOffs = [];
    for (let i = 0; i < numParts; i++) {
        const start = (partSize * i) + startOffset;
        const end = Math.min(start + partSize, fileSize + startOffset);
        partOffs.push({
            start,
            end
        });
    }
    return partOffs;
}
exports._divideMultipartCopyParts = _divideMultipartCopyParts;
;
