const proto = exports;
/**
 * getSymlink
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

proto.getSymlink = async function getSymlink(name, options) {
  options = options || {};
  options.subres = 'symlink';
  name = this._objectName(name);
  const params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const target = result.res.headers['x-oss-symlink-target'];
  return {
    targetName: decodeURIComponent(target),
    res: result.res
  };
};
