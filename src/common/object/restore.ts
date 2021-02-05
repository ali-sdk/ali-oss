import { Client } from '../../setConfig';
import { MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';

/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */

export async function restore(
  this: Client,
  name: string,
  options: MultiVersionCommonOptions = {}
) {
  options.subres = Object.assign({ restore: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = _objectRequestParams.call(this, 'POST', name, options);
  params.successStatuses = [202];

  const result = await this.request(params);

  return {
    res: result.res,
  } as NormalSuccessResponse;
}
