import path from 'path';
import mime from 'mime/lite';
import putStream from '../putStream';
import initMultipartUpload from '../initMultipartUpload';
import _resumeMultipart from './_resumeMultipart';
import isBlob from '../utils/isBlob';
import isFile from '../utils/isFile';
import _getFileSize from '../utils/_getFileSize';
import _createStream from '../utils/_createStream';
import _getPartSize from '../utils/_getPartSize';
import _convertMetaToHeaders from '../utils/_convertMetaToHeaders';
import resetCancelFlag from '../utils/resetCancelFlag';

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
export default async function multipartUpload(client, name, file, options) {
  resetCancelFlag(client);
  options = options || {};
  if (options.checkpoint && options.checkpoint.uploadId) {
    return await _resumeMultipart(client, options.checkpoint, options);
  }

  const minPartSize = 100 * 1024;

  if (!options.mime) {
    if (isFile(file)) {
      options.mime = mime.getType(path.extname(file.name));
    } else if (isBlob(file)) {
      options.mime = file.type;
    } else {
      options.mime = mime.getType(path.extname(file));
    }
  }

  options.headers = options.headers || {};
  _convertMetaToHeaders(options.meta, options.headers);

  const fileSize = await _getFileSize(file);
  if (fileSize < minPartSize) {
    const stream = _createStream(file, 0, fileSize);
    options.contentLength = fileSize;

    const result = await putStream(client, name, stream, options);
    if (options && options.progress) {
      await options.progress(1);
    }

    const ret = {
      res: result.res,
      bucket: client.options.bucket,
      name,
      etag: result.res.headers.etag
    };

    if ((options.headers && options.headers['x-oss-callback']) || options.callback) {
      ret.data = result.data;
    }

    return ret;
  }
  if (options.partSize && !(parseInt(options.partSize, 10) === options.partSize)) {
    throw new Error('partSize must be int number');
  }

  if (options.partSize && options.partSize < minPartSize) {
    throw new Error(`partSize must not be smaller than ${minPartSize}`);
  }

  const initResult = await initMultipartUpload(client, name, options);
  const { uploadId } = initResult;
  const partSize = _getPartSize(fileSize, options.partSize);

  const checkpoint = {
    file,
    name,
    fileSize,
    partSize,
    uploadId,
    doneParts: []
  };

  if (options && options.progress) {
    await options.progress(0, checkpoint, initResult.res);
  }

  return await _resumeMultipart(client, checkpoint, options);
}

