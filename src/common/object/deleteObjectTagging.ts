import { objectName } from '../utils/objectName';

/**
 * deleteObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 */

export async function deleteObjectTagging(
  this: any,
  name: string,
  options: any = {}
) {
  options.subres = Object.assign({ tagging: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = this._objectRequestParams('DELETE', name, options);
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res,
  };
}
