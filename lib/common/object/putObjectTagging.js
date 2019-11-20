const utils = require('../utils/index.js');

const proto = exports;
/**
 * putObjectTagging
 * @param {Sting} name - object name
 * @param {Object} tag -  object tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */

proto.putObjectTagging = async function putObjectTagging(name, tag, options = {}) {
  if (Object.prototype.toString.call(tag) !== '[object Object]') {
    throw new Error('tag must be Object');
  }
  options.subres = 'tagging';
  name = this._objectName(name);
  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];
  tag = Object.keys(tag).map(key => ({
    Key: key,
    Value: tag[key]
  }));

  const paramXMLObj = {
    Tagging: {
      TagSet: {
        Tag: tag
      }
    }
  };

  params.mime = 'xml';
  params.content = utils.obj2xml(paramXMLObj);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
};
