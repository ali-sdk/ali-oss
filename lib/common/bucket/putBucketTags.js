const obj2xml = require('../utils/obj2xml');
const checkTag = require('../utils/checkObjectTag');

const proto = exports;
/**
 * putBucketTags
 * @param {Sting} name - object name
 * @param {Object} tag -  object tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */

proto.putBucketTags = async function putBucketTags(name, tag, options = {}) {
  this._checkBucketName(name);
  checkTag(tag);

  options.subres = 'tagging';
  const params = this._bucketRequestParams('PUT', name, options);
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
  params.content = obj2xml(paramXMLObj);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
};
