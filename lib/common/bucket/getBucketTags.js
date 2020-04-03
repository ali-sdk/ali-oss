const proto = exports;
const _checkBucketName = require('../utils/checkBucketName');
const isObject = require('../utils/isObject');
/**
 * getBucketTags
 * @param {String} name - bucket name
 * @param {Object} options
 * @return {Object}
 */

proto.getBucketTags = async function getBucketTags(name, options = {}) {
  _checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'tagging', options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const Tagging = await this.parseXML(result.data);
  let { Tag } = Tagging.TagSet;
  Tag = Tag && isObject(Tag) ? [Tag] : Tag || [];

  const tag = {};

  Tag.forEach((item) => {
    tag[item.Key] = item.Value;
  });

  return {
    status: result.status,
    res: result.res,
    tag
  };
};
