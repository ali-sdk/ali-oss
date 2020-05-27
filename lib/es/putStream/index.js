import _objectName from '../utils/_objectName';
import _convertMetaToHeaders from '../utils/_convertMetaToHeaders';
import _objectUrl from '../utils/_objectUrl';
import callback from '../../common/callback';

export default async function putStream(client, name, stream, options) {
  options = options || {};
  options.headers = options.headers || {};
  name = _objectName(name);
  if (options.contentLength) {
    options.headers['Content-Length'] = options.contentLength;
  } else {
    options.headers['Transfer-Encoding'] = 'chunked';
  }
  _convertMetaToHeaders(options.meta, options.headers);

  const method = options.method || 'PUT';
  const params = client._objectRequestParams(method, name, options);
  callback.encodeCallback(params, options);
  params.mime = options.mime;
  params.stream = stream;
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

