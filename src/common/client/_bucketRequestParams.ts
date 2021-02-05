import { Subres } from '../../types/params';

export function _bucketRequestParams(method, bucket, subres, options): {
  method: string,
  bucket: string,
  subres: Subres,
  timeout: number | string,
  ctx: object,
  successStatuses?: number[],
  xmlResponse?: boolean,
  mime?: string,
  content?: Buffer | string,
  headers?: object
} {
  return {
    method,
    bucket,
    subres,
    timeout: options && options.timeout,
    ctx: options && options.ctx,
  };
}
