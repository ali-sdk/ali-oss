const crypto = require('crypto');
const is = require('is-type-of');
const qs = require('qs');
const { lowercaseKeyHeader } = require('./utils/lowercaseKeyHeader');
const { encodeString } = require('./utils/encodeString');

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
    const processFunc = key => {
      canonicalizedResource += separatorString + key;
      if (parameters[key] || parameters[key] === 0) {
        canonicalizedResource += `=${parameters[key]}`;
      }
      separatorString = '&';
    };
    Object.keys(parameters).sort().forEach(processFunc);
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

  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf(OSS_PREFIX) === 0) {
      headersToSign[lowerKey] = String(headers[key]).trim();
    }
  });

  Object.keys(headersToSign)
    .sort()
    .forEach(key => {
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
 * @param {string[]} [additionalHeaders]
 * @returns {string[]}
 */
exports.fixAdditionalHeaders = additionalHeaders => {
  if (!additionalHeaders) {
    return [];
  }

  const OSS_PREFIX = 'x-oss-';

  return [...new Set(additionalHeaders.map(v => v.toLowerCase()))]
    .filter(v => {
      return v !== 'content-type' && v !== 'content-md5' && !v.startsWith(OSS_PREFIX);
    })
    .sort();
};

/**
 * @param {string} method
 * @param {Object} request
 * @param {Object} request.headers
 * @param {Object} [request.queries]
 * @param {string} [bucketName]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders] additional headers after deduplication, lowercase and sorting
 * @returns {string}
 */
exports.getCanonicalRequest = function getCanonicalRequest(method, request, bucketName, objectName, additionalHeaders) {
  const headers = lowercaseKeyHeader(request.headers);
  const queries = request.queries || {};
  const OSS_PREFIX = 'x-oss-';

  if (objectName && !bucketName) {
    throw Error('Please ensure that bucketName is passed into getCanonicalRequest.');
  }

  const signContent = [
    method.toUpperCase(), // HTTP Verb
    encodeString(`/${bucketName ? `${bucketName}/` : ''}${objectName || ''}`).replace(/%2F/g, '/') // Canonical URI
  ];

  // Canonical Query String
  signContent.push(
    qs.stringify(queries, {
      encoder: encodeString,
      sort: (a, b) => a.localeCompare(b),
      strictNullHandling: true
    })
  );

  // Canonical Headers
  if (additionalHeaders) {
    additionalHeaders.forEach(v => {
      if (!Object.prototype.hasOwnProperty.call(headers, v)) {
        throw Error(`Can't find additional header ${v} in request headers.`);
      }
    });
  }

  const tempHeaders = new Set(additionalHeaders);

  Object.keys(headers).forEach(v => {
    if (v === 'content-type' || v === 'content-md5' || v.startsWith(OSS_PREFIX)) {
      tempHeaders.add(v);
    }
  });

  const canonicalHeaders = `${[...tempHeaders]
    .sort()
    .map(v => `${v}:${is.string(headers[v]) ? headers[v].trim() : headers[v]}\n`)
    .join('')}`;

  signContent.push(canonicalHeaders);

  // Additional Headers
  if (additionalHeaders.length > 0) {
    signContent.push(additionalHeaders.join(';'));
  } else {
    signContent.push('');
  }

  // Hashed Payload
  signContent.push(headers['x-oss-content-sha256'] || 'UNSIGNED-PAYLOAD');

  return signContent.join('\n');
};

/**
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} date ISO8601 UTC:yyyymmdd'T'HHMMss'Z'
 * @param {string} canonicalRequest
 * @returns {string}
 */
exports.getStringToSign = function getStringToSign(region, date, canonicalRequest) {
  const stringToSign = [
    'OSS4-HMAC-SHA256',
    date, // TimeStamp
    `${date.split('T')[0]}/${region}/oss/aliyun_v4_request`, // Scope
    crypto.createHash('sha256').update(canonicalRequest).digest('hex') // Hashed Canonical Request
  ];

  return stringToSign.join('\n');
};

/**
 * @param {String} accessKeySecret
 * @param {string} date yyyymmdd
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} stringToSign
 * @returns {string}
 */
exports.getSignatureV4 = function getSignatureV4(accessKeySecret, date, region, stringToSign) {
  const signingDate = crypto.createHmac('sha256', `aliyun_v4${accessKeySecret}`).update(date).digest();
  const signingRegion = crypto.createHmac('sha256', signingDate).update(region).digest();
  const signingOss = crypto.createHmac('sha256', signingRegion).update('oss').digest();
  const signingKey = crypto.createHmac('sha256', signingOss).update('aliyun_v4_request').digest();
  const signatureValue = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  return signatureValue;
};

/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {string} region Standard region, e.g. cn-hangzhou
 * @param {string} method
 * @param {Object} request
 * @param {Object} request.headers
 * @param {Object} [request.queries]
 * @param {string} [bucketName]
 * @param {string} [objectName]
 * @param {string[]} [additionalHeaders]
 * @param {string} [headerEncoding='utf-8']
 * @returns {string}
 */
exports.authorizationV4 = function authorizationV4(
  accessKeyId,
  accessKeySecret,
  region,
  method,
  request,
  bucketName,
  objectName,
  additionalHeaders,
  headerEncoding = 'utf-8'
) {
  const fixedAdditionalHeaders = this.fixAdditionalHeaders(additionalHeaders);
  const fixedHeaders = {};
  Object.entries(request.headers).forEach(v => {
    fixedHeaders[v[0]] = is.string(v[1]) ? Buffer.from(v[1], headerEncoding).toString() : v[1];
  });
  const date = fixedHeaders['x-oss-date'] || (request.queries && request.queries['x-oss-date']);
  const canonicalRequest = this.getCanonicalRequest(
    method,
    {
      headers: fixedHeaders,
      queries: request.queries
    },
    bucketName,
    objectName,
    fixedAdditionalHeaders
  );
  const stringToSign = this.getStringToSign(region, date, canonicalRequest);
  const onlyDate = date.split('T')[0];
  const signatureValue = this.getSignatureV4(accessKeySecret, onlyDate, region, stringToSign);
  const additionalHeadersValue =
    fixedAdditionalHeaders.length > 0 ? `AdditionalHeaders=${fixedAdditionalHeaders.join(';')},` : '';

  return `OSS4-HMAC-SHA256 Credential=${accessKeyId}/${onlyDate}/${region}/oss/aliyun_v4_request,${additionalHeadersValue}Signature=${signatureValue}`;
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
    Object.keys(options.response).forEach(k => {
      const key = `response-${k.toLowerCase()}`;
      subResource[key] = options.response[k];
    });
  }

  Object.keys(options).forEach(key => {
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
    if (options.callback.callbackSNI) {
      json.callbackSNI = options.callback.callbackSNI;
    }
    subResource.callback = Buffer.from(JSON.stringify(json)).toString('base64');

    if (options.callback.customValue) {
      const callbackVar = {};
      Object.keys(options.callback.customValue).forEach(key => {
        callbackVar[`x:${key}`] = options.callback.customValue[key];
      });
      subResource['callback-var'] = Buffer.from(JSON.stringify(callbackVar)).toString('base64');
    }
  }

  const canonicalString = this.buildCanonicalString(
    options.method,
    resource,
    {
      headers,
      parameters: subResource
    },
    expires.toString()
  );

  return {
    Signature: this.computeSignature(accessKeySecret, canonicalString, headerEncoding),
    subResource
  };
};
