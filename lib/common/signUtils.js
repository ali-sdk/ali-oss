
const crypto = require('crypto');
const is = require('is-type-of');
const copy = require('copy-to');

/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
exports.buildCanonicalizedResource = function buildCanonicalizedResource(resourcePath, parameters) {
  let canonicalizedResource = `${resourcePath}`;
  let separatorString = '?';

  if (is.string(parameters) && parameters.trim() !== '') {
    canonicalizedResource += separatorString + parameters;
  } else if (is.array(parameters)) {
    parameters.sort();
    canonicalizedResource += separatorString + parameters.join('&');
  } else if (parameters) {
    const compareFunc = (entry1, entry2) => {
      if (entry1[0] >= entry2[0]) {
        return 1;
      }
      return 0;
    };
    const processFunc = ([key, value]) => {
      canonicalizedResource += separatorString + key;
      if (value) {
        canonicalizedResource += `=${value}`;
      }
      separatorString = '&';
    };
    Object.entries(parameters).sort(compareFunc).forEach(processFunc);
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
  request = request || {};
  const headers = request.headers || {};
  const HEADER_CONTENT_TYPE = 'content-type';
  const HEADER_CONTENT_MD5 = 'content-md5';
  const OSS_PREFIX = 'x-oss-';
  const canonicalElements = [method];
  const headersToSign = {};

  Object.entries(headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === HEADER_CONTENT_TYPE
      || lowerKey === HEADER_CONTENT_MD5
      || lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(value).trim();
    }
  });

  if (!Object.prototype.hasOwnProperty.call(headersToSign, HEADER_CONTENT_MD5)) {
    headersToSign.HEADER_CONTENT_MD5 = '';
  }

  if (!Object.prototype.hasOwnProperty.call(headersToSign, HEADER_CONTENT_TYPE)) {
    headersToSign.HEADER_CONTENT_TYPE = '';
  }

  const compareFunc = (a, b) => {
    if (a[0] >= b[0]) {
      return 1;
    }
    return 0;
  };

  const processFunc = ([key, value]) => {
    if (key.indexOf(OSS_PREFIX) !== 0) {
      canonicalElements.push(value);
    } else {
      canonicalElements.push(`${key}:${value}`);
    }
  };

  Object.entries(headersToSign).sort(compareFunc).forEach(processFunc);

  expires = expires || headersToSign['x-oss-date'];
  canonicalElements.splice(3, 0, expires);

  canonicalElements.push(this.buildCanonicalizedResource(resourcePath, request.parameters));

  return canonicalElements.join('\n');
};

/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.computeSignature = function computeSignature(accessKeySecret, canonicalString) {
  const signature = crypto.createHmac('sha1', accessKeySecret);
  return signature.update(new Buffer(canonicalString, 'utf8')).digest('base64');
};

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.authorization = function authorization(accessKeyId, accessKeySecret, canonicalString) {
  return `OSS ${accessKeyId}:${this.computeSignature(accessKeySecret, canonicalString)}`;
};

/**
 *
 * @param {String} accessKeySecret
 * @param {Object} options
 * @param {String} resource
 * @param {Number} expires
 */
exports._signatureForURL = function _signatureForURL(accessKeySecret, options, resource, expires) {
  const headers = {};
  const subResource = {};

  if (options.process) {
    const processKeyword = 'x-oss-process';
    subResource[processKeyword] = options.process;
  }

  if (options.response) {
    Object.entries(options.response).forEach(([k, value]) => {
      const key = `response-${k.toLowerCase()}`;
      subResource[key] = value;
    });
  }

  Object.entries(options).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf('x-oss-') === 0) {
      headers[lowerKey] = value;
    } else if (lowerKey !== 'expires' && lowerKey !== 'response' && lowerKey !== 'process' && lowerKey !== 'method') {
      subResource[lowerKey] = value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(options, 'security-token')) {
    subResource['security-token'] = options['security-token'];
  }

  if (Object.prototype.hasOwnProperty.call(options, 'callback')) {
    const callback = {};
    const callbackVars = {};
    let hasCBElements = false;
    let hasCBVElements = false;

    if (Object.prototype.hasOwnProperty.call(options.callback, 'url')) {
      hasCBElements = true;
      callback.callbackUrl = options.callback.url;
    }

    if (Object.prototype.hasOwnProperty.call(options.callback, 'host')) {
      hasCBElements = true;
      callback.callbackHost = options.callback.host;
    }

    if (Object.prototype.hasOwnProperty.call(options.callback, 'body')) {
      hasCBElements = true;
      callback.callbackBody = options.callback.body;
    }

    if (Object.prototype.hasOwnProperty.call(options.callback, 'contentType')) {
      hasCBElements = true;
      callback.callbackBodyType = options.callback.contentType;
    }

    if (Object.prototype.hasOwnProperty.call(options.callback, 'customValue')) {
      hasCBVElements = true;
      copy(options.callback.customValue).to(callbackVars);
    }

    if (hasCBElements) {
      subResource.callback = new Buffer(JSON.stringify(callback)).toString('base64');
    }

    if (hasCBVElements) {
      subResource['callback-var'] = new Buffer(JSON.stringify(callbackVars)).toString('base64');
    }

  }

  const canonicalString = this.buildCanonicalString(options.method, resource, {
    headers,
    parameters: subResource,
  }, expires.toString());

  return {
    Signature: this.computeSignature(accessKeySecret, canonicalString),
    subResource,
  };
};
