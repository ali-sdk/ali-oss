'use strict';

var crypto = require('crypto');
var is = require('is-type-of');

/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
exports.buildCanonicalizedResource = function buildCanonicalizedResource(resourcePath, parameters) {
  var canonicalizedResource = '' + resourcePath;
  var separatorString = '?';

  if (is.string(parameters) && parameters.trim() !== '') {
    canonicalizedResource += separatorString + parameters;
  } else if (is.array(parameters)) {
    parameters.sort();
    canonicalizedResource += separatorString + parameters.join('&');
  } else if (parameters) {
    var keys = Object.keys(parameters).sort();
    for (var key in keys) {
      var paramKey = keys[key];
      canonicalizedResource += separatorString + paramKey;
      var parameterValue = parameters[paramKey];
      if (parameterValue) {
        canonicalizedResource += '=' + parameterValue;
      }
      separatorString = '&';
    }
  }

  return canonicalizedResource;
};

/**
 * @param {String} method
 * @param {String} resourcePath
 * @param {Object} request
 * @param {String} expires
 * @return {String} canonicalString
 */
exports.buildCanonicalString = function canonicalString(method, resourcePath, request, expires) {
  var HEADER_CONTENT_TYPE = 'content-type';
  var HEADER_CONTENT_MD5 = 'content-md5';
  var OSS_PREFIX = 'x-oss-';

  var headers = request.headers || {};
  var canonicalElements = [method];

  var headersToSign = {};
  for (var key in headers) {
    var lowerKey = key.toLowerCase();
    if (lowerKey === HEADER_CONTENT_TYPE
        || lowerKey === HEADER_CONTENT_MD5
        || lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(headers[key]).trim();
    }
  }

  if (!headersToSign.hasOwnProperty(HEADER_CONTENT_MD5)) {
    headersToSign.HEADER_CONTENT_MD5 = '';
  }

  if (!headersToSign.hasOwnProperty(HEADER_CONTENT_TYPE)) {
    headersToSign.HEADER_CONTENT_TYPE = '';
  }

  var keys = Object.keys(headersToSign).sort();
  for (var key in keys) {
    var parameterName = keys[key];
    var parameterValue = headersToSign[parameterName];
    if (parameterName.indexOf(OSS_PREFIX) !== 0) {
      canonicalElements.push(parameterValue);
    } else {
      canonicalElements.push(parameterName + ':' + parameterValue);
    }
  }
  expires = expires || headersToSign["x-oss-date"];
  canonicalElements.splice(3, 0, expires);

  canonicalElements.push(this.buildCanonicalizedResource(resourcePath, request.parameters));

  return canonicalElements.join('\n');
};

/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.computeSignature = function computeSignature(accessKeySecret, canonicalString) {
  var signature = crypto.createHmac('sha1', accessKeySecret);
  return signature.update(new Buffer(canonicalString, 'utf8')).digest('base64');
};

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.authorization = function authorization(accessKeyId, accessKeySecret, canonicalString) {
  return 'OSS ' + accessKeyId + ':' + this.computeSignature(accessKeySecret, canonicalString);
};
