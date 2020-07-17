import { objectName } from '../utils/objectName';

/*
 * Get object's ACL
 * @param {String} name the object key
 * @param {Object} options
 * @return {Object}
 */

export async function getACL(this: any, name: string, options: any = {}) {
  options.subres = Object.assign({ acl: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);

  const params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200];
  params.xmlResponse = true;

  const result = await this.request(params);

  return {
    acl: result.data.AccessControlList.Grant,
    owner: {
      id: result.data.Owner.ID,
      displayName: result.data.Owner.DisplayName,
    },
    res: result.res,
  };
}
