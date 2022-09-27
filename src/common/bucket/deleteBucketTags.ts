import { checkBucketName } from '../utils/checkBucketName';
import { RequestOptions } from '../../types/params';
import { isArray } from '../utils/isArray';
import { isObject } from '../utils/isObject';

/**
 * deleteBucketTags
 * @param {String} name - bucket name
 * @param {Array} tags - tags
 * @param {Object} options
 */

export async function deleteBucketTags(this: any) {
  const name: string = arguments[0];
  checkBucketName(name);
  let options: RequestOptions = {};
  let subres: string | object = 'tagging';

  if (arguments.length === 2) {
    if (isArray(arguments[1])) {
      subres = { tagging: arguments[1].toString() };
    }
    if (isObject(arguments[1])) {
      options = arguments[1];
    }
  }

  if (arguments.length === 3) {
    if (!isArray(arguments[1])) {
      throw new Error('tags must be Array');
    }
    subres = { tagging: arguments[1].toString() };
    options = arguments[2];
  }

  const params = this._bucketRequestParams('DELETE', name, subres, options);
  params.successStatuses = [204];

  const result = await this.request(params);

  return {
    status: result.status,
    res: result.res,
  };
}
