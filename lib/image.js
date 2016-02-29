/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   zensh <admin@zensh.com> (https://github.com/zensh)
 */

'use strict';

/**
 * Module dependencies.
 */

/* istanbul ignore next */
module.exports = function (OssClient) {

  function ImageClient(options) {
    if (!(this instanceof ImageClient)) {
      return new ImageClient(options);
    }
    if (!options.bucket) {
      throw new Error('require bucket for image service instance');
    }
    if (!options.imageHost) {
      throw new Error('require imageHost for image service instance');
    }

    this.ossClient = new OssClient(options);
    this.ossClient.options.imageHost = options.imageHost;
    this.ossClient._objectRequestParams = objectRequestParams;
  }

  /**
   * Image operations
   */

  ImageClient.prototype.get = function* (name, file, options) {
    return yield this.ossClient.get(name, file, options);
  };

  ImageClient.prototype.getStream = function* (name, options) {
    return yield this.ossClient.getStream(name, options);
  };

  ImageClient.prototype.getExif = function* (name, options) {
    var params = this.ossClient._objectRequestParams('GET', name + '@exif', options);
    params.successStatuses = [200];

    var result = yield* this.ossClient.request(params);
    result = yield this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.getInfo = function* (name, options) {
    var params = this.ossClient._objectRequestParams('GET', name + '@infoexif', options);
    params.successStatuses = [200];

    var result = yield* this.ossClient.request(params);
    result = yield this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.putStyle = function* (styleName, style, options) {
    var params = this.ossClient._objectRequestParams('PUT', '/?style&styleName=' + styleName, options);
    params.successStatuses = [200];
    params.content = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<Style><Content>' + style + '</Content></Style>';

    var result = yield* this.ossClient.request(params);
    result = yield this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.getStyle = function* (styleName, options) {
    var params = this.ossClient._objectRequestParams('GET', '/?style&styleName=' + styleName, options);
    params.successStatuses = [200];

    var result = yield* this.ossClient.request(params);
    result = yield this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.listStyle = function* (options) {
    var params = this.ossClient._objectRequestParams('GET', '/?style', options);
    params.successStatuses = [200];

    var result = yield* this.ossClient.request(params);
    result = yield this._parseResponse(result);
    return {
      res: result.res,
      data: result.data.Style
    };
  };

  ImageClient.prototype.deleteStyle = function* (styleName, options) {
    var params = this.ossClient._objectRequestParams('DELETE', '/?style&styleName=' + styleName, options);
    params.successStatuses = [204];

    var result = yield* this.ossClient.request(params);
    return {
      res: result.res,
    };
  };

  ImageClient.prototype.signatureUrl = function (name) {
    return this.ossClient.signatureUrl(name, this.ossClient.options.imageHost);
  };

  ImageClient.prototype._parseResponse = function* (result) {
    var str = result.data.toString();
    var type = result.res.headers['content-type'];

    if (type === 'application/json') {
      var data = JSON.parse(str);
      result.data = {};
      for (var key in data) {
        result.data[key] = parseFloat(data[key].value, 10) || data[key].value;
      }
    } else if (type === 'application/xml') {
      result.data = yield this.ossClient.parseXML(str);
    }
    return result;
  };

  return ImageClient;
};

/* istanbul ignore next */
function objectRequestParams(method, name, options) {
  options = options || {};
  name = this._objectName(name);
  var authResource = '/' + this.options.bucket + '/' + name;
  var params = {
    name: name,
    method: method,
    host: this.options.imageHost,
    resource: '/' + name,
    timeout: options.timeout,
    authResource: authResource
  };

  if (options.headers) {
    params.headers = options.headers;
  }
  return params;
}
