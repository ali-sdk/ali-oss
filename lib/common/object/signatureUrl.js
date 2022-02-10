const urlutil = require('url');
const utility = require('utility');
const copy = require('copy-to');
const signHelper = require('../../common/signUtils');
const { isIP } = require('../utils/isIP');
const { isFunction } = require('../../common/utils/isFunction');
const { checkCredentials } = require('../utils/setSTSToken');
const { formatObjKey } = require('../utils/formatObjKey');
const proto = exports;

proto.signatureUrl = function signatureUrl(name, options) {
  if (isIP(this.options.endpoint.hostname)) {
    throw new Error('can not get the object URL when endpoint is IP');
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
    const now = new Date();
    if (this.stsTokenFreshTime >= this.options.refreshSTSTokenInterval) {
      this.stsTokenFreshTime = now;
      this.options.refreshSTSToken().then(r => {
        const credentials = formatObjKey(r, 'firstLowerCase');
        if (credentials.securityToken) {
          credentials.stsToken = credentials.securityToken;
        }
        checkCredentials(credentials);
        Object.assign(this.options, credentials);
      });
    } else {
      this.stsTokenFreshTime = now;
    }
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
