/* eslint-disable no-async-promise-executor */

const debug = require('debug')('ali-oss:multipart-copy');
const copy = require('copy-to');

const proto = exports;


/**
 * Upload a part copy in a multipart from the source bucket/object
 * used with initMultipartUpload and completeMultipartUpload.
 * @param {String} name copy object name
 * @param {String} uploadId the upload id
 * @param {Number} partNo the part number
 * @param {String} range  like 0-102400  part size need to copy
 * @param {Object} sourceData
 *        {String} sourceData.sourceKey  the source object name
 *        {String} sourceData.sourceBucketName  the source bucket name
 * @param {Object} options
 */
/* eslint max-len: [0] */
proto.uploadPartCopy = async function uploadPartCopy(name, uploadId, partNo, range, sourceData, options = {}) {
  options.headers = options.headers || {};
  const versionId = options.versionId || (options.subres && options.subres.versionId) || null;
  let copySource;
  if (versionId) {
    copySource = `/${sourceData.sourceBucketName}/${encodeURIComponent(sourceData.sourceKey)}?versionId=${versionId}`;
  } else {
    copySource = `/${sourceData.sourceBucketName}/${encodeURIComponent(sourceData.sourceKey)}`;
  }

  options.headers['x-oss-copy-source'] = copySource;
  if (range) {
    options.headers['x-oss-copy-source-range'] = `bytes=${range}`;
  }

  options.subres = {
    partNumber: partNo,
    uploadId
  };
  const params = this._objectRequestParams('PUT', name, options);
  params.mime = options.mime;
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    name,
    etag: result.res.headers.etag,
    res: result.res
  };
};

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
proto.multipartUploadCopy = async function multipartUploadCopy(name, sourceData, options = {}) {
  this.resetCancelFlag();
  const { versionId = null } = options;
  const metaOpt = {
    versionId
  };
  const objectMeta = await this._getObjectMeta(sourceData.sourceBucketName, sourceData.sourceKey, metaOpt);
  const fileSize = objectMeta.res.headers['content-length'];
  sourceData.startOffset = sourceData.startOffset || 0;
  sourceData.endOffset = sourceData.endOffset || fileSize;

  if (options.checkpoint && options.checkpoint.uploadId) {
    return await this._resumeMultipartCopy(options.checkpoint, sourceData, options);
  }

  const minPartSize = 100 * 1024;

  const copySize = sourceData.endOffset - sourceData.startOffset;
  if (copySize < minPartSize) {
    throw new Error(`copySize must not be smaller than ${minPartSize}`);
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error(`partSize must not be smaller than ${minPartSize}`);
  }

  const init = await this.initMultipartUpload(name, options);
  const { uploadId } = init;
  const partSize = this._getPartSize(copySize, options.partSize);

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

  return await this._resumeMultipartCopy(checkpoint, sourceData, options);
};

/*
 * Resume multipart copy from checkpoint. The checkpoint will be
 * updated after each successful part copy.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
proto._resumeMultipartCopy = async function _resumeMultipartCopy(checkpoint, sourceData, options) {
  if (this.isCancel()) {
    throw this._makeCancelEvent();
  }
  const { versionId = null } = options;
  const metaOpt = {
    versionId
  };
  const {
    copySize, partSize, uploadId, doneParts, name
  } = checkpoint;

  const partOffs = this._divideMultipartCopyParts(copySize, partSize, sourceData.startOffset);
  const numParts = partOffs.length;

  const uploadPartCopyOptions = {
    headers: {}
  };

  if (options.copyheaders) {
    copy(options.copyheaders).to(uploadPartCopyOptions.headers);
  }
  if (versionId) {
    copy(metaOpt).to(uploadPartCopyOptions);
  }

  const uploadPartJob = function uploadPartJob(self, partNo, source) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!self.isCancel()) {
          const pi = partOffs[partNo - 1];
          const range = `${pi.start}-${pi.end - 1}`;

          let result;
          try {
            result = await self.uploadPartCopy(name, uploadId, partNo, range, source, uploadPartCopyOptions);
          } catch (error) {
            if (error.status === 404) {
              throw self._makeAbortEvent();
            }
            throw error;
          }
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
      } catch (err) {
        err.partNum = partNo;
        reject(err);
      }
    });
  };

  const all = Array.from(new Array(numParts), (x, i) => i + 1);
  const done = doneParts.map(p => p.number);
  const todo = all.filter(p => done.indexOf(p) < 0);
  const defaultParallel = 5;
  const parallel = options.parallel || defaultParallel;

  if (this.checkBrowserAndVersion('Internet Explorer', '10') || parallel === 1) {
    for (let i = 0; i < todo.length; i++) {
      if (this.isCancel()) {
        throw this._makeCancelEvent();
      }
      /* eslint no-await-in-loop: [0] */
      await uploadPartJob(this, todo[i], sourceData);
    }
  } else {
    // upload in parallel
    const errors = await this._parallelNode(todo, parallel, uploadPartJob, sourceData);

    const abortEvent = errors.find(err => err.name === 'abort');
    if (abortEvent) throw abortEvent;

    if (this.isCancel()) {
      throw this._makeCancelEvent();
    }

    // check errors after all jobs are completed
    if (errors && errors.length > 0) {
      const err = errors[0];
      err.message = `Failed to copy some parts with error: ${err.toString()} part_num: ${err.partNum}`;
      throw err;
    }
  }

  return await this.completeMultipartUpload(name, uploadId, doneParts, options);
};

proto._divideMultipartCopyParts = function _divideMultipartCopyParts(fileSize, partSize, startOffset) {
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
};

/**
 * Get Object Meta
 * @param {String} bucket  bucket name
 * @param {String} name   object name
 * @param {Object} options
 */
proto._getObjectMeta = async function _getObjectMeta(bucket, name, options) {
  const currentBucket = this.getBucket();
  this.setBucket(bucket);
  const data = await this.head(name, options);
  this.setBucket(currentBucket);
  return data;
};
