import { GetObjectOptions } from '../../types/params';

export async function getStream(
  this: any,
  name: string,
  options: GetObjectOptions = {}
) {
  options.subres = Object.assign({}, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  if (options.process) {
    options.subres = options.subres || {};
    options.subres['x-oss-process'] = options.process;
  }

  const params = this._objectRequestParams('GET', name, options);
  params.customResponse = true;
  params.successStatuses = [200, 206, 304];

  const result = await this.request(params);

  return {
    stream: result.res,
    res: {
      status: result.status,
      headers: result.headers,
    },
  };
}
