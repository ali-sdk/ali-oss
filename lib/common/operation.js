'use strict';

var copy = require('copy-to');
var proto = exports;


/**
 * Upload a part copy in a multipart from the source bucket/object, used with initMultipartUpload and completeMultipartUpload.
 * @param {String}
 * @param {String} uploadId the upload id
 * @param {Integer} partNo the part number
 * @param {Integer} size
 * @param {Object} sourceData {sourceKey: the source object name, sourceBucketName: the source bucket name}
 * @param {Object} options
 */
proto.uploadPartCopy = function* uploadPartCopy(name, uploadId, partNo, range, sourceData, options) {
  options = options || {};
  options.headers = options.headers || {};
  var copySource = '/' + sourceData.sourceBucketName + '/' + encodeURIComponent(sourceData.sourceKey);
  var tempHeaders = {
    'x-oss-copy-source': copySource
  };
  if (range) {
    tempHeaders["x-oss-copy-source-range"] = 'bytes=' + range;
  }

  copy(tempHeaders).to(options.headers);

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