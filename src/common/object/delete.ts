import { Client } from '../../setConfig';
import { MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';

/**
 * delete
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

export async function deleteObject(
  this: Client,
  name: string,
  options: MultiVersionCommonOptions = {}
): Promise<NormalSuccessResponse> {
  options.subres = Object.assign({}, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = _objectRequestParams.call(this, 'DELETE', name, options);
  params.successStatuses = [204];

  const result = await this.request(params);

  return {
    res: result.res,
  };
}
