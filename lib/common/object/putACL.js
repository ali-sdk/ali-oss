const proto = exports;

/*
 * Set object's ACL
 * @param {String} name the object key
 * @param {String} acl the object ACL
 * @param {Object} options
 */
proto.putACL = async function putACL(name, acl, options) {
  options = options || {};
  options.subres = Object.assign({ acl: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  options.headers = options.headers || {};
  options.headers['x-oss-object-acl'] = acl;
  name = this._objectName(name);

  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    res: result.res
  };
};
