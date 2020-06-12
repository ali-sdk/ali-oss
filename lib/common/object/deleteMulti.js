/* eslint-disable object-curly-newline */
const utility = require('utility');
const { obj2xml } = require('../utils/obj2xml');

const proto = exports;

proto.deleteMulti = async function deleteMulti(names, options = {}) {
  const objects = [];
  if (!names || !names.length) {
    throw new Error('names is required');
  }
  for (let i = 0; i < names.length; i++) {
    const object = {};
    if (typeof names[i] === 'string') {
      object.Key = utility.escape(this._objectName(names[i]));
    } else {
      const { key, versionId } = names[i];
      object.Key = utility.escape(this._objectName(key));
      object.VersionId = versionId;
    }
    objects.push(object);
  }

  const paramXMLObj = {
    Delete: {
      Quiet: !!options.quiet,
      Object: objects
    }
  };

  const paramXML = obj2xml(paramXMLObj, {
    headers: true
  });

  options.subres = Object.assign({ delete: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = this._objectRequestParams('POST', '', options);
  params.mime = 'xml';
  params.content = paramXML;
  params.xmlResponse = true;
  params.successStatuses = [200];
  const result = await this.request(params);

  const r = result.data;
  let deleted = (r && r.Deleted) || null;
  if (deleted) {
    if (!Array.isArray(deleted)) {
      deleted = [deleted];
    }
  }
  return {
    res: result.res,
    deleted: deleted || []
  };
};
