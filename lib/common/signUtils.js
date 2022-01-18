
const crypto = require('crypto');
const is = require('is-type-of');
const { lowercaseKeyHeader } = require('./utils/lowercaseKeyHeader')

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
      if (entry1[0] > entry2[0]) {
        return 1;
      } else if (entry1[0] < entry2[0]) {
        return -1;
      }
      return 0;
    };
    const processFunc = (key) => {
      canonicalizedResource += separatorString + key;
      if (parameters[key] || parameters[key] === 0) {
        canonicalizedResource += `=${parameters[key]}`;
      }
      separatorString = '&';
    };
    Object.keys(parameters).sort(compareFunc).forEach(processFunc);
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
  const headers = lowercaseKeyHeader(request.headers);
  const OSS_PREFIX = 'x-oss-';
  const ossHeaders = [];
  const headersToSign = {};

  let signContent = [
    method.toUpperCase(),
    headers['content-md5'] || '',
    headers['content-type'],
    expires || headers['x-oss-date']
  ];

  Object.keys(headers).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(headers[key]).trim();
    }
  });

  Object.keys(headersToSign).sort().forEach((key) => {
    ossHeaders.push(`${key}:${headersToSign[key]}`);
  });

  signContent = signContent.concat(ossHeaders);

  signContent.push(this.buildCanonicalizedResource(resourcePath, request.parameters));

  return signContent.join('\n');
};

/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.computeSignature = function computeSignature(accessKeySecret, canonicalString, headerEncoding = 'utf-8') {
  const signature = crypto.createHmac('sha1', accessKeySecret);
  return signature.update(Buffer.from(canonicalString, headerEncoding)).digest('base64');
};

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
exports.authorization = function authorization(accessKeyId, accessKeySecret, canonicalString, headerEncoding) {
  return `OSS ${accessKeyId}:${this.computeSignature(accessKeySecret, canonicalString, headerEncoding)}`;
};

/**
 *
 * @param {String} accessKeySecret
 * @param {Object} options
 * @param {String} resource
 * @param {Number} expires
 */
exports._signatureForURL = function _signatureForURL(accessKeySecret, options = {}, resource, expires, headerEncoding) {
  const headers = {};
  const { subResource = {} } = options;

  if (options.process) {
    const processKeyword = 'x-oss-process';
    subResource[processKeyword] = options.process;
  }

  if (options.trafficLimit) {
    const trafficLimitKey = 'x-oss-traffic-limit';
    subResource[trafficLimitKey] = options.trafficLimit;
  }

  if (options.response) {
    Object.keys(options.response).forEach((k) => {
      const key = `response-${k.toLowerCase()}`;
      subResource[key] = options.response[k];
    });
  }

  Object.keys(options).forEach((key) => {
    const lowerKey = key.toLowerCase();
    const value = options[key];
    if (lowerKey.indexOf('x-oss-') === 0) {
      headers[lowerKey] = value;
    } else if (lowerKey.indexOf('content-md5') === 0) {
      headers[key] = value;
    } else if (lowerKey.indexOf('content-type') === 0) {
      headers[key] = value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(options, 'security-token')) {
    subResource['security-token'] = options['security-token'];
  }

  if (Object.prototype.hasOwnProperty.call(options, 'callback')) {
    const json = {
      callbackUrl: encodeURI(options.callback.url),
      callbackBody: options.callback.body
    };
    if (options.callback.host) {
      json.callbackHost = options.callback.host;
    }
    if (options.callback.contentType) {
      json.callbackBodyType = options.callback.contentType;
    }
    subResource.callback = Buffer.from(JSON.stringify(json)).toString('base64');

    if (options.callback.customValue) {
      const callbackVar = {};
      Object.keys(options.callback.customValue).forEach((key) => {
        callbackVar[`x:${key}`] = options.callback.customValue[key];
      });
      subResource['callback-var'] = Buffer.from(JSON.stringify(callbackVar)).toString('base64');
    }
  }

  const canonicalString = this.buildCanonicalString(options.method, resource, {
    headers,
    parameters: subResource
  }, expires.toString());

  return {
    Signature: this.computeSignature(accessKeySecret, canonicalString, headerEncoding),
    subResource
  };
};
