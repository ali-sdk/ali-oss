"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeMultipart = void 0;
/* eslint-disable no-async-promise-executor */
const divideParts_1 = require("../../common/utils/divideParts");
const completeMultipartUpload_1 = require("./completeMultipartUpload");
const handleUploadPart_1 = require("./handleUploadPart");
const _makeCancelEvent_1 = require("../utils/_makeCancelEvent");
const _parallel_1 = require("../utils/_parallel");
const isArray_1 = require("../utils/isArray");
/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
async function resumeMultipart(checkpoint, options = {}) {
    if (this.isCancel()) {
        throw _makeCancelEvent_1._makeCancelEvent();
    }
    const { file, fileSize, partSize, uploadId, doneParts, name } = checkpoint;
    const partOffs = divideParts_1.divideParts(fileSize, partSize);
    const numParts = partOffs.length;
    let uploadPartJob = partNo => {
        return new Promise(async (resolve, reject) => {
            let hasUploadPart = checkpoint.doneParts.find(_ => _.number === partNo);
            if (hasUploadPart) {
                resolve(hasUploadPart);
                return;
            }
            try {
                if (!this.isCancel()) {
                    const pi = partOffs[partNo - 1];
                    const stream = this._createStream(file, pi.start, pi.end);
                    const data = {
                        stream,
                        size: pi.end - pi.start,
                    };
                    if (isArray_1.isArray(this.multipartUploadStreams)) {
                        this.multipartUploadStreams.push(stream);
                    }
                    else {
                        this.multipartUploadStreams = [stream];
                    }
                    const result = await handleUploadPart_1.handleUploadPart.call(this, name, uploadId, partNo, data, options);
                    hasUploadPart = checkpoint.doneParts.find(_ => _.number === partNo);
                    if (hasUploadPart) {
                        resolve(hasUploadPart);
                        return;
                    }
                    if (!this.isCancel()) {
                        doneParts.push({
                            number: partNo,
                            etag: result.res.headers.etag,
                        });
                        checkpoint.doneParts = doneParts;
                        if (options.progress) {
                            await options.progress(doneParts.length / numParts, checkpoint, result.res);
                        }
                        resolve({
                            number: partNo,
                            etag: result.res.headers.etag,
                        });
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
    if (this.checkBrowserAndVersion('Internet Explorer', '10') ||
        parallel === 1) {
        for (let i = 0; i < todo.length; i++) {
            if (this.isCancel()) {
                throw _makeCancelEvent_1._makeCancelEvent();
            }
            /* eslint no-await-in-loop: [0] */
            await uploadPartJob(todo[i]);
        }
    }
    else {
        // upload in parallel
        const jobErr = await _parallel_1._parallel.call(this, todo, parallel, uploadPartJob);
        if (this.isCancel()) {
            uploadPartJob = null;
            throw _makeCancelEvent_1._makeCancelEvent();
        }
        if (jobErr && jobErr.length > 0) {
            jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${jobErr[0].partNum}`;
            throw jobErr[0];
        }
    }
    return await completeMultipartUpload_1.completeMultipartUpload.call(this, name, uploadId, doneParts, options);
}
exports.resumeMultipart = resumeMultipart;
