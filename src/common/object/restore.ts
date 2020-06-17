import { objectRequestParams } from '../utils/objectRequestParams';

/**
 * Restore Object
 * @param {String} name the object key
 * @param {Object} options
 * @returns {{res}}
 */

export async function restore(this: any, name, options) {
  options = options || {};
  options.subres = Object.assign({ restore: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = objectRequestParams('POST', name, this.options.bucket, options);
  params.successStatuses = [202];

  const result = await this.request(params);

  return {
    res: result.res
  };
};