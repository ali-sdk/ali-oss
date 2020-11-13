const urlutil = require('url');
const { isIP } = require('../utils/isIP');

const proto = exports;

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint and bucket`.
 * @return {String} object url include bucket
 */
proto.generateObjectUrl = function generateObjectUrl(name, baseUrl) {
  if (isIP(this.options.endpoint.hostname)) {
    throw new Error('can not get the object URL when endpoint is IP');
  }
  if (!baseUrl) {
    baseUrl = this.options.endpoint.format();
    const copyUrl = urlutil.parse(baseUrl);
    const { bucket } = this.options;

    copyUrl.hostname = `${bucket}.${copyUrl.hostname}`;
    copyUrl.host = `${bucket}.${copyUrl.host}`;
    baseUrl = copyUrl.format();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + this._escape(this._objectName(name));
};
