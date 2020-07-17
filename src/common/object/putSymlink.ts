
import { objectName } from '../utils/objectName';
import { convertMetaToHeaders } from '../utils/convertMetaToHeaders';
import { escapeName } from '../utils/escapeName';

/**
 * putSymlink
 * @param {String} name - object name
 * @param {String} targetName - target name
 * @param {Object} options
 * @param {{res}}
 */

export async function putSymlink(this: any, name: string, targetName: string, options: any = {}) {
  options.headers = options.headers || {};
  targetName = escapeName(objectName(targetName));
  convertMetaToHeaders(options.meta, options.headers);
  options.headers['x-oss-symlink-target'] = targetName;
  options.subres = Object.assign({ symlink: '' }, options.subres);

  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }

  if (options.storageClass) {
    options.headers['x-oss-storage-class'] = options.storageClass;
  }
  name = objectName(name);

  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];
  const result = await this.request(params);

  return {
    res: result.res
  };
}
