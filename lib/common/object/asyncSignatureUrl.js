const urlutil = require('url');
const utility = require('utility');
const copy = require('copy-to');
const signHelper = require('../../common/signUtils');
const { isIP } = require('../utils/isIP');
const { setSTSToken } = require('../utils/setSTSToken');
const { isFunction } = require('../utils/isFunction');

const proto = exports;

/**
 * asyncSignatureUrl
 * @param {String} name object name
 * @param {Object} options options
 * @param {boolean} [strictObjectNameValidation=true] the flag of verifying object name strictly
 */
proto.asyncSignatureUrl = async function asyncSignatureUrl(name, options, strictObjectNameValidation = true) {
  if (isIP(this.options.endpoint.hostname)) {
    throw new Error('can not get the object URL when endpoint is IP');
  }

  if (strictObjectNameValidation && /^\?/.test(name)) {
    throw new Error(`Invalid object name ${name}`);
  }

  options = options || {};
  name = this._objectName(name);
  options.method = options.method || 'GET';
  const expires = utility.timestamp() + (options.expires || 1800);
  const params = {
    bucket: this.options.bucket,
    object: name
  };

  const resource = this._getResource(params);

  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }

  if (this.options.stsToken) {
    options['security-token'] = this.options.stsToken;
  }

  const signRes = signHelper._signatureForURL(this.options.accessKeySecret, options, resource, expires);

  const url = urlutil.parse(this._getReqUrl(params));
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signRes.Signature
  };

  copy(signRes.subResource).to(url.query);

  return url.format();
};
