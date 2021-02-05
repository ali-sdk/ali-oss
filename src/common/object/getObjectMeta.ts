import { objectName } from '../utils/objectName';
import { MultiVersionCommonOptions, NormalSuccessResponseWithStatus } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';

/**
 * getObjectMeta
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

export async function getObjectMeta(
  this: Client,
  name: string,
  options: MultiVersionCommonOptions = {}
): Promise<NormalSuccessResponseWithStatus> {
  name = objectName(name);
  options.subres = Object.assign({ objectMeta: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = _objectRequestParams.call(this, 'HEAD', name, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res
  };
}

