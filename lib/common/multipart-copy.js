'use strict';

var debug = require('debug')('ali-oss:multipart-copy');
var copy = require('copy-to');
var proto = exports;


/**
 * Upload a part copy in a multipart from the source bucket/object, used with initMultipartUpload and completeMultipartUpload.
 * @param {String} name copy object name
 * @param {String} uploadId the upload id
 * @param {Number} partNo the part number
 * @param {String} range  like 0-102400  part size need to copy
 * @param {Object} sourceData
 *        {String} sourceData.sourceKey  the source object name
 *        {String} sourceData.sourceBucketName  the source bucket name
 * @param {Object} options
 */
proto.uploadPartCopy = function* uploadPartCopy(name, uploadId, partNo, range, sourceData, options) {
  options = options || {};
  options.headers = options.headers || {};
  var copySource = '/' + sourceData.sourceBucketName + '/' + encodeURIComponent(sourceData.sourceKey);
  options.headers["x-oss-copy-source"] = copySource;
  if (range) {
    options.headers["x-oss-copy-source-range"] = 'bytes=' + range;
  }

  options.subres = {
    partNumber: partNo,
    uploadId: uploadId
  };
  var params = this._objectRequestParams('PUT', name, options);
  params.mime = options.mime;
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    name: name,
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
proto.multipartUploadCopy = function* multipartUploadCopy(name, sourceData, options) {
  this.resetCancelFlag();
  options = options || {};
  var objectMeta = yield this._getObjectMeta(sourceData.sourceBucketName, sourceData.sourceKey, {});
  var fileSize = objectMeta.res.headers['content-length'];
  sourceData.startOffset = sourceData.startOffset || 0;
  sourceData.endOffset = sourceData.endOffset || fileSize;

  if (options.checkpoint && options.checkpoint.uploadId) {
    return yield this._resumeMultipartCopy(options.checkpoint, sourceData, options);
  }

  var minPartSize = 100 * 1024;

  var copySize = sourceData.endOffset - sourceData.startOffset;
  if (copySize < minPartSize) {
    throw new Error('copySize must not be smaller than ' + minPartSize);
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error('partSize must not be smaller than ' + minPartSize);
  }

  var result = yield this.initMultipartUpload(name, options);
  var uploadId = result.uploadId;
  var partSize = this._getPartSize(copySize, options.partSize);

  var checkpoint = {
    name: name,
    copySize: copySize,
    partSize: partSize,
    uploadId: uploadId,
    doneParts: []
  };

  if (options && options.progress) {
    yield options.progress(0, checkpoint, result.res);
  }

  return yield this._resumeMultipartCopy(checkpoint, sourceData, options);
};

/*
 * Resume multipart copy from checkpoint. The checkpoint will be
 * updated after each successful part copy.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
proto._resumeMultipartCopy = function* _resumeMultipartCopy(checkpoint, sourceData, options) {
  if (this.isCancel()) {
    throw this._makeCancelEvent();
  }
  var copySize = checkpoint.copySize;
  var partSize = checkpoint.partSize;
  var uploadId = checkpoint.uploadId;
  var doneParts = checkpoint.doneParts;
  var name = checkpoint.name;

  var partOffs = this._divideMultipartCopyParts(copySize, partSize, sourceData.startOffset);
  var numParts = partOffs.length;

  var uploadPartCopyOptions = {
    headers:{}
  };

  if (options.copyheaders) {
    copy(options.copyheaders).to(uploadPartCopyOptions.headers);
  }

  var uploadPartJob = function* (self, partNo, sourceData) {
    if (!self.isCancel()) {
      try {
        var pi = partOffs[partNo - 1];
        var range = pi.start + '-' + (pi.end - 1);

        var result = yield self.uploadPartCopy(name, uploadId, partNo, range, sourceData, uploadPartCopyOptions);

        if (!self.isCancel()) {
          debug('content-range ' + result.res.headers['content-range']);
          doneParts.push({
            number: partNo,
            etag: result.res.headers.etag
          });
          checkpoint.doneParts = doneParts;

          if (options && options.progress) {
            yield options.progress(doneParts.length / numParts, checkpoint, result.res);
          }
        }

      } catch (err) {
        err.partNum = partNo;
        throw err;
      }
    }
  };

  var all = Array.from(new Array(numParts), (x, i) => i + 1);
  var done = doneParts.map(p => p.number);
  var todo = all.filter(p => done.indexOf(p) < 0);
  var defaultParallel = 5;
  var parallel = options.parallel || defaultParallel;

  if (this.checkBrowserAndVersion('Internet Explorer', '10') || parallel === 1) {
    for (var i = 0; i < todo.length; i++) {
      if (this.isCancel()) {
        throw this._makeCancelEvent();
      }
      yield uploadPartJob(this, todo[i], sourceData);
    }
  } else {
    // upload in parallel
    var jobs = [];
    for (var i = 0; i < todo.length; i++) {
      jobs.push(uploadPartJob(this, todo[i], sourceData));
    }

    // start uploads jobs
    var errors = yield this._thunkPool(jobs, parallel);

    if (this.isCancel()) {
      jobs = null;
      throw this._makeCancelEvent();
    }

    // check errors after all jobs are completed
    if (errors && errors.length > 0) {
      var err = errors[0];
      err.message = 'Failed to copy some parts with error: ' + err.toString() + " part_num: "+ err.partNum;
      throw err;
    }
  }

  return yield this.completeMultipartUpload(name, uploadId, doneParts, options);
};

proto._divideMultipartCopyParts = function _divideMultipartCopyParts(fileSize, partSize, startOffset) {
  var numParts = Math.ceil(fileSize / partSize);

  var partOffs = [];
  for (var i = 0; i < numParts; i++) {
    var start = partSize * i + startOffset;
    var end = Math.min(start + partSize, fileSize + startOffset);

    partOffs.push({
      start: start,
      end: end
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
proto._getObjectMeta = function* _getObjectMeta(bucket, name, options) {
  var currentBucket = this.getBucket();
  this.setBucket(bucket);
  var data = yield this.head(name, options);
  this.setBucket(currentBucket);
  return data;
};