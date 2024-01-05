const dateFormat = require('dateformat');
const { URL } = require('url');
const _toString = require('lodash/toString');

const signHelper = require('../../common/signUtils');
const { setSTSToken } = require('../utils/setSTSToken');
const { isFunction } = require('../utils/isFunction');
const { getStandardRegion } = require('../utils/getStandardRegion');

const proto = exports;

/**
 * signatureUrlV4
 *
 * @param {string} method
 * @param {number} expires
 * @param {Object} [request]
 * @param {Object} [request.headers]
 * @param {Object} [request.queries]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders]
 */
proto.signatureUrlV4 = async function signatureUrlV4(method, expires, request, objectName, additionalHeaders) {
  const headers = (request && request.headers) || {};
  const queries = { ...((request && request.headers) || {}) };
  const date = new Date();
  const formattedDate = dateFormat(date, "UTC:yyyymmdd'T'HHMMss'Z'");
  const onlyDate = formattedDate.split('T')[0];
  const fixedAdditionalHeaders = signHelper.fixAdditionalHeaders(additionalHeaders);
  const region = getStandardRegion(this.options.region);

  if (fixedAdditionalHeaders.length > 0) {
    queries['x-oss-additional-headers'] = fixedAdditionalHeaders.join(';');
  }
  queries['x-oss-credential'] = `${this.options.accessKeyId}/${onlyDate}/${region}/oss/aliyun_v4_request`;
  queries['x-oss-date'] = formattedDate;
  queries['x-oss-expires'] = expires;
  queries['x-oss-signature-version'] = 'OSS4-HMAC-SHA256';

  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }

  if (this.options.stsToken) {
    queries['x-oss-security-token'] = this.options.stsToken;
  }

  const canonicalRequest = signHelper.getCanonicalRequest(
    method,
    {
      headers,
      queries
    },
    this.options.bucket,
    objectName,
    fixedAdditionalHeaders
  );
  const stringToSign = signHelper.getStringToSign(region, formattedDate, canonicalRequest);

  queries['x-oss-signature'] = signHelper.getSignatureV4(this.options.accessKeySecret, onlyDate, region, stringToSign);

  const signedUrl = new URL(
    this._getReqUrl({
      bucket: this.options.bucket,
      object: objectName
    })
  );

  Object.entries(queries).forEach(v => {
    signedUrl.searchParams.append(v[0], _toString(v[1]));
  });

  return signedUrl.href;
};
