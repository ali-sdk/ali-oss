
const fs = require('fs');
const is = require('is-type-of');
const util = require('util');
const path = require('path');
const mime = require('mime');

const proto = exports;

/**
 * Multipart operations
 */

/**
 * Upload a file to OSS using multipart uploads
 * @param {String} name
 * @param {String|File} file
 * @param {Object} options
 *        {Object} options.callback The callback parameter is composed of a JSON string encoded in Base64
 *        {String} options.callback.url the OSS sends a callback request to this URL
 *        {String} options.callback.host The host header value for initiating callback requests
 *        {String} options.callback.body The value of the request body when a callback is initiated
 *        {String} options.callback.contentType The Content-Type of the callback requests initiatiated
 *        {Object} options.callback.customValue Custom parameters are a map of key-values, e.g:
 *                  customValue = {
 *                    key1: 'value1',
 *                    key2: 'value2'
 *                  }
 */
proto.multipartUpload = async function multipartUpload(name, file, options) {
  this.resetCancelFlag();
  options = options || {};
  if (options.checkpoint && options.checkpoint.uploadId) {
    return await this._resumeMultipart(options.checkpoint, options);
  }

  const minPartSize = 100 * 1024;
  const filename = is.file(file) ? file.name : file;
  options.mime = options.mime || mime.lookup(path.extname(filename));
  options.headers = options.headers || {};
  this._convertMetaToHeaders(options.meta, options.headers);

  const fileSize = await this._getFileSize(file);
  if (fileSize < minPartSize) {
    const stream = this._createStream(file, 0, fileSize);
    options.contentLength = fileSize;

    const result = await this.putStream(name, stream, options);
    if (options && options.progress) {
      await options.progress(1);
    }

    const ret = {
      res: result.res,
      bucket: this.options.bucket,
      name,
      etag: result.res.headers.etag,
    };

    if ((options.headers && options.headers['x-oss-callback']) || options.callback) {
      ret.data = result.data;
    }

    return ret;
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error(`partSize must not be smaller than ${minPartSize}`);
  }

  const initResult = await this.initMultipartUpload(name, options);
  const { uploadId } = initResult;
  const partSize = this._getPartSize(fileSize, options.partSize);

  const checkpoint = {
    file,
    name,
    fileSize,
    partSize,
    uploadId,
    doneParts: [],
  };

  if (options && options.progress) {
    await options.progress(0, checkpoint, initResult.res);
  }

  return await this._resumeMultipart(checkpoint, options);
};

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
proto._resumeMultipart = async function _resumeMultipart(checkpoint, options) {
  if (this.isCancel()) {
    throw this._makeCancelEvent();
  }
  const {
    file, fileSize, partSize, uploadId, doneParts, name,
  } = checkpoint;

  const partOffs = this._divideParts(fileSize, partSize);
  const numParts = partOffs.length;

  let uploadPartJob = function uploadPartJob(self, partNo) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!self.isCancel()) {
          const pi = partOffs[partNo - 1];
          const data = {
            stream: self._createStream(file, pi.start, pi.end),
            size: pi.end - pi.start,
          };

          const result = await self._uploadPart(name, uploadId, partNo, data);
          if (!self.isCancel()) {
            doneParts.push({
              number: partNo,
              etag: result.res.headers.etag,
            });
            checkpoint.doneParts = doneParts;

            if (options.progress) {
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
      await uploadPartJob(this, todo[i]);
    }
  } else {
    // upload in parallel
    const jobErr = await this._parallelNode(todo, parallel, uploadPartJob);

    if (this.isCancel()) {
      uploadPartJob = null;
      throw this._makeCancelEvent();
    }

    if (jobErr && jobErr.length > 0) {
      jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${jobErr[0].partNum}`;
      throw jobErr[0];
    }
  }

  return await this.completeMultipartUpload(name, uploadId, doneParts, options);
};


is.file = function (file) {
  return typeof (File) !== 'undefined' && file instanceof File;
};

/**
 * Get file size
 */
proto._getFileSize = async function _getFileSize(file) {
  if (is.buffer(file)) {
    return file.length;
  } else if (is.file(file)) {
    return file.size;
  } if (is.string(file)) {
    const stat = await this._statFile(file);
    return stat.size;
  }

  throw new Error('_getFileSize requires Buffer/File/String.');
};

/*
 * Readable stream for Web File
 */
const { Readable } = require('stream');

function WebFileReadStream(file, options) {
  if (!(this instanceof WebFileReadStream)) {
    return new WebFileReadStream(file, options);
  }

  Readable.call(this, options);

  this.file = file;
  this.reader = new FileReader();
  this.start = 0;
  this.finish = false;
  this.fileBuffer = null;
}
util.inherits(WebFileReadStream, Readable);

WebFileReadStream.prototype.readFileAndPush = function readFileAndPush(size) {
  if (this.fileBuffer) {
    let pushRet = true;
    while (pushRet && this.fileBuffer && this.start < this.fileBuffer.length) {
      const { start } = this;
      let end = start + size;
      end = end > this.fileBuffer.length ? this.fileBuffer.length : end;
      this.start = end;
      pushRet = this.push(this.fileBuffer.slice(start, end));
    }
  }
};

WebFileReadStream.prototype._read = function _read(size) {
  if ((this.file && this.start >= this.file.size) ||
      (this.fileBuffer && this.start >= this.fileBuffer.length) ||
      (this.finish) || (this.start === 0 && !this.file)) {
    if (!this.finish) {
      this.fileBuffer = null;
      this.finish = true;
    }
    this.push(null);
    return;
  }

  const defaultReadSize = 16 * 1024;
  size = size || defaultReadSize;

  const that = this;
  this.reader.onload = function (e) {
    that.fileBuffer = new Buffer(new Uint8Array(e.target.result));
    that.file = null;
    that.readFileAndPush(size);
  };

  if (this.start === 0) {
    this.reader.readAsArrayBuffer(this.file);
  } else {
    this.readFileAndPush(size);
  }
};

proto._createStream = function _createStream(file, start, end) {
  if (is.file(file)) {
    return new WebFileReadStream(file.slice(start, end));
  } else if (is.string(file)) {
    return fs.createReadStream(file, {
      start,
      end: end - 1,
    });
  }
  throw new Error('_createStream requires File/String.');
};

proto._getPartSize = function _getPartSize(fileSize, partSize) {
  const maxNumParts = 10 * 1000;
  const defaultPartSize = 1 * 1024 * 1024;

  if (!partSize) {
    return defaultPartSize;
  }

  return Math.max(
    Math.ceil(fileSize / maxNumParts),
    partSize,
  );
};

proto._divideParts = function _divideParts(fileSize, partSize) {
  const numParts = Math.ceil(fileSize / partSize);

  const partOffs = [];
  for (let i = 0; i < numParts; i++) {
    const start = partSize * i;
    const end = Math.min(start + partSize, fileSize);

    partOffs.push({
      start,
      end,
    });
  }

  return partOffs;
};
