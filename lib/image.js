/* istanbul ignore next */
module.exports = function (OssClient) {
  /* istanbul ignore next */
  //   function objectRequestParams(method, name, options) {
  //     options = options || {};
  //     name = this._objectName(name);
  //     const authResource = `/${this.options.bucket}/${name}`;
  //     const params = {
  //       name,
  //       method,
  //       host: this.options.imageHost,
  //       resource: `/${name}`,
  //       timeout: options.timeout,
  //       authResource,
  //       ctx: options.ctx
  //     };
  //     if (options.headers) {
  //       params.headers = options.headers;
  //     }
  //     return params;
  //   }

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

    options.endpoint = options.imageHost;
    this.ossClient = new OssClient(options);
    this.ossClient.options.imageHost = options.imageHost;
    // this.ossClient._objectRequestParams = objectRequestParams;
  }

  /**
   * Image operations
   */

  ImageClient.prototype.get = async function get(name, file, options) {
    return await this.ossClient.get(name, file, options);
  };

  ImageClient.prototype.getStream = async function getStream(name, options) {
    return await this.ossClient.getStream(name, options);
  };

  ImageClient.prototype.getExif = async function getExif(name, options) {
    const params = this.ossClient._objectRequestParams('GET', `${name}@exif`, options);
    params.successStatuses = [200];

    let result = await this.ossClient.request(params);
    result = await this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.getInfo = async function getInfo(name, options) {
    const params = this.ossClient._objectRequestParams('GET', `${name}@infoexif`, options);
    params.successStatuses = [200];

    let result = await this.ossClient.request(params);
    result = await this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.putStyle = async function putStyle(styleName, style, options) {
    const params = this.ossClient._objectRequestParams('PUT', `/?style&styleName=${styleName}`, options);
    params.successStatuses = [200];
    params.content = `${'<?xml version="1.0" encoding="UTF-8"?>\n<Style><Content>'}${style}</Content></Style>`;

    let result = await this.ossClient.request(params);
    result = await this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.getStyle = async function getStyle(styleName, options) {
    const params = this.ossClient._objectRequestParams('GET', `/?style&styleName=${styleName}`, options);
    params.successStatuses = [200];

    let result = await this.ossClient.request(params);
    result = await this._parseResponse(result);
    return {
      res: result.res,
      data: result.data
    };
  };

  ImageClient.prototype.listStyle = async function listStyle(options) {
    const params = this.ossClient._objectRequestParams('GET', '/?style', options);
    params.successStatuses = [200];

    let result = await this.ossClient.request(params);
    result = await this._parseResponse(result);
    return {
      res: result.res,
      data: result.data.Style
    };
  };

  ImageClient.prototype.deleteStyle = async function deleteStyle(styleName, options) {
    const params = this.ossClient._objectRequestParams('DELETE', `/?style&styleName=${styleName}`, options);
    params.successStatuses = [204];

    const result = await this.ossClient.request(params);
    return {
      res: result.res
    };
  };

  ImageClient.prototype.signatureUrl = function signatureUrl(name) {
    return this.ossClient.signatureUrl(name);
  };

  ImageClient.prototype._parseResponse = async function _parseResponse(result) {
    const str = result.data.toString();
    const type = result.res.headers['content-type'];

    if (type === 'application/json') {
      const data = JSON.parse(str);
      result.data = {};
      if (data) {
        Object.keys(data).forEach(key => {
          result.data[key] = parseFloat(data[key].value, 10) || data[key].value;
        });
      }
    } else if (type === 'application/xml') {
      result.data = await this.ossClient.parseXML(str);
    }
    return result;
  };

  return ImageClient;
};
