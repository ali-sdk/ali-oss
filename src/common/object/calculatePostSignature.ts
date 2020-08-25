import { policy2Str } from '../utils/policy2Str';
import { computeSignature } from '../utils/signUtils';
import { isObject } from '../utils/isObject';

/**
 * @param {Object or JSON} policy specifies the validity of the fields in the request.
 * @return {Object} params
 *         {String} params.OSSAccessKeyId
 *         {String} params.Signature
 *         {String} params.policy JSON text encoded with UTF-8 and Base64.
 */

export function calculatePostSignature(this: any, policy: object | string) {
  if (!isObject(policy) && typeof policy !== 'string') {
    throw new Error('policy must be JSON string or Object');
  }
  if (!isObject(policy)) {
    try {
      JSON.stringify(JSON.parse((policy as string)));
    } catch (error) {
      throw new Error('policy must be JSON string or Object');
    }
  }
  policy = Buffer.from(policy2Str(policy), 'utf8').toString('base64');

  const Signature = computeSignature(this.options.accessKeySecret, policy);

  const query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Signature,
    policy,
  };
  return query;
}
