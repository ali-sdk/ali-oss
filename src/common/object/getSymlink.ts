import { objectName } from '../utils/objectName';
import { MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';
/**
 * getSymlink
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

export async function getSymlink(this: Client, name: string, options: MultiVersionCommonOptions = {}) {
  options.subres = Object.assign({ symlink: '' }, options.subres);

  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = _objectRequestParams.call(this, 'GET', name, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const target = result.res.headers['x-oss-symlink-target'];

  return {
    targetName: decodeURIComponent(target),
    res: result.res as NormalSuccessResponse['res']
  };
}

