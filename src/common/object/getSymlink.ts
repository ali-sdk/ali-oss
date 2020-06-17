import { objectName } from '../utils/objectName';
import { objectRequestParams } from '../utils/objectRequestParams';
/**
 * getSymlink
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

export async function getSymlink(this: any, name, options: any = {}) {
  options.subres = Object.assign({ symlink: '' }, options.subres);

  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = objectRequestParams('GET', name, this.options.bucket, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const target = result.res.headers['x-oss-symlink-target'];

  return {
    targetName: decodeURIComponent(target),
    res: result.res
  };
};
