export default function _objectUrl(client, name) {
  return client._getReqUrl({ bucket: client.options.bucket, object: name });
}
