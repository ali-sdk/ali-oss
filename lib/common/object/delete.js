const proto = exports;
/**
 * delete
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

proto.delete = async function _delete(name, options = {}) {
  options.subres = Object.assign({}, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = this._objectRequestParams('DELETE', name, options);
  params.successStatuses = [204];

  const result = await this.request(params);

  return {
    res: result.res
  };
};
