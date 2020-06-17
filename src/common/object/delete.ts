import { objectRequestParams } from '../utils/objectRequestParams';
/**
 * delete
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

export async function deleteObject(this: any, name: string, options: any = {}) {
  options.subres = Object.assign({}, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = objectRequestParams('DELETE', name, this.options.bucket, options);
  params.successStatuses = [204];

  const result = await this.request(params);

  return {
    res: result.res
  };
};
