
const { policy2Str } = require('../utils/policy2Str');
const signHelper = require('../signUtils');
const { isObject } = require('../utils/isObject');

const proto = exports;

/**
 * @param {Object or JSON} policy specifies the validity of the fields in the request.
 * @return {Object} params
 *         {String} params.OSSAccessKeyId
 *         {String} params.Signature
 *         {String} params.policy JSON text encoded with UTF-8 and Base64.
 */
proto.calculatePostSignature = function calculatePostSignature(policy) {
  if (!isObject(policy) && typeof policy !== 'string') {
    throw new Error('policy must be JSON string or Object');
  }
  if (!isObject(policy)) {
    try {
      JSON.stringify(JSON.parse(policy));
    } catch (error) {
      throw new Error('policy must be JSON string or Object');
    }
  }
  policy = Buffer.from(policy2Str(policy), 'utf8').toString('base64');

  const Signature = signHelper.computeSignature(this.options.accessKeySecret, policy);

  const query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Signature,
    policy
  };
  return query;
};
