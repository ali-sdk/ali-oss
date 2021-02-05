import { objectName } from '../utils/objectName';
import { MultiVersionCommonOptions, NormalSuccessResponseWithStatus } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';

/**
 * deleteObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 */

export async function deleteObjectTagging(
  this: Client,
  name: string,
  options: MultiVersionCommonOptions = {}
) {
  options.subres = Object.assign({ tagging: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = _objectRequestParams.call(this, 'DELETE', name, options);
  params.successStatuses = [204];
  const result: NormalSuccessResponseWithStatus = await this.request(params);

  return {
    status: result.status,
    res: result.res,
  };
}
