import { objectName } from '../utils/objectName';

import { ACLType, MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
/*
 * Set object's ACL
 * @param {String} name the object key
 * @param {String} acl the object ACL
 * @param {Object} options
 */
export async function putACL(this: any, name: string, acl: ACLType, options: MultiVersionCommonOptions = {}) {
  options.subres = Object.assign({ acl: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  options.headers = options.headers || {};
  options.headers['x-oss-object-acl'] = acl;
  name = objectName(name);

  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    res: result.res
  } as NormalSuccessResponse;
}
