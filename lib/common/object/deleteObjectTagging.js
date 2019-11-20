const proto = exports;
/**
 * deleteObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 */

proto.deleteObjectTagging = async function deleteObjectTagging(
  name,
  options = {}
) {
  options.subres = 'tagging';
  name = this._objectName(name);
  const params = this._objectRequestParams('DELETE', name, options);
  params.successStatuses = [204];
  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res
  };
};
