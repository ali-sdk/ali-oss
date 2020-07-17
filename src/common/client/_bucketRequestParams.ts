export function _bucketRequestParams(method, bucket, subres, options) {
  return {
    method,
    bucket,
    subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  };
}
