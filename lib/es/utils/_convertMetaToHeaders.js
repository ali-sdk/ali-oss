export default function _convertMetaToHeaders(meta, headers) {
  if (!meta) {
    return;
  }

  Object.keys(meta).forEach((k) => {
    headers[`x-oss-meta-${k}`] = meta[k];
  });
}
