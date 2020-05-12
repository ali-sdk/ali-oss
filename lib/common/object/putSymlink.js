const proto = exports;
/**
 * putSymlink
 * @param {String} name - object name
 * @param {String} targetName - target name
 * @param {Object} options
 * @param {{res}}
 */

proto.putSymlink = async function putSymlink(name, targetName, options) {
  options = options || {};
  options.headers = options.headers || {};
  targetName = this._escape(this._objectName(targetName));
  this._convertMetaToHeaders(options.meta, options.headers);
  options.headers['x-oss-symlink-target'] = targetName;
  options.subres = Object.assign({ symlink: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }

  if (options.storageClass) {
    options.headers['x-oss-storage-class'] = options.storageClass;
  }

  name = this._objectName(name);
  const params = this._objectRequestParams('PUT', name, options);

  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    res: result.res
  };
};
