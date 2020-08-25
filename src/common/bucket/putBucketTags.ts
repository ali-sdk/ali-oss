import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';
import { checkBucketTag } from '../utils/checkBucketTag';
import { RequestOptions } from '../../types/params';

/**
 * putBucketTags
 * @param {String} name - bucket name
 * @param {Object} tag -  bucket tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */

export async function putBucketTags(this: any, name: string, tag: object, options: RequestOptions = {}) {
  checkBucketName(name);
  checkBucketTag(tag);
  const params = this._bucketRequestParams('PUT', name, 'tagging', options);
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
}
