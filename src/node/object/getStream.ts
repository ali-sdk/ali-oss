import OSS from '..';
import { _objectRequestParams } from '../../common/client/_objectRequestParams';
import { ObjectGetOptions, ObjectGetStreamReturnType } from '../../types/object';

export async function getStream(
  this: OSS,
  name: string,
  options: ObjectGetOptions = {}
): Promise<ObjectGetStreamReturnType> {
  options.subres = Object.assign({}, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  if (options.process) {
    options.subres = options.subres || {};
    options.subres['x-oss-process'] = options.process;
  }

  const params = _objectRequestParams.call(this, 'GET', name, options);
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
