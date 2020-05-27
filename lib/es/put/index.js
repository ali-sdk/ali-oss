import is from 'is-type-of';
import path from 'path';
import mime from 'mime/lite';
import _objectUrl from '../utils/_objectUrl';
import _objectName from '../utils/_objectName';
import _createStream from '../utils/_createStream';
import isBlob from '../utils/isBlob';
import isFile from '../utils/isFile';
import _convertMetaToHeaders from '../utils/_convertMetaToHeaders';
import _getFileSize from '../utils/_getFileSize';
import putStream from '../putStream';
import callback from '../../common/callback';


export default async function put(client, name, file, options) {
  let content;
  options = options || {};
  name = _objectName(name);
  if (is.buffer(file)) {
    content = file;
  } else if (isBlob(file) || isFile(file)) {
    if (!options.mime) {
      if (isFile(file)) {
        options.mime = mime.getType(path.extname(file.name));
      } else {
        options.mime = file.type;
      }
    }

    const stream = _createStream(file, 0, file.size);
    options.contentLength = await _getFileSize(file);
    try {
      const result = await putStream(client, name, stream, options);
      return result;
    } catch (err) {
      if (err.code === 'RequestTimeTooSkewed') {
        client.options.amendTimeSkewed = +new Date(err.serverTime) - new Date();
        return await put(client, name, file, options);
      }
    }
  } else {
    throw new TypeError('Must provide Buffer/Blob/File for put.');
  }

  options.headers = options.headers || {};
  _convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = client._objectRequestParams(method, name, options);
  callback.encodeCallback(params, options);
  params.mime = options.mime;
  params.content = content;
  params.successStatuses = [200];

  const result = await client.request(params);

  const ret = {
    name,
    url: _objectUrl(client, name),
    res: result.res
  };

  if (params.headers && params.headers['x-oss-callback']) {
    ret.data = JSON.parse(result.data.toString());
  }

  return ret;
}
