const { get } = require('./get');

const proto = exports;
/**
 * head
 * @param {String} name - object name
 * @param {Object} options
 * @param {{res}}
 */

proto.head = async function head(name, options = {}) {
  const { useGet } = options;
  let result;
  if (useGet) {
    result = await get.bind(this)(
      name,
      Object.assign({}, options, {
        headers: {
          Range: 'bytes=0-0'
        }
      })
    );
  } else {
    options.subres = Object.assign({}, options.subres);
    if (options.versionId) {
      options.subres.versionId = options.versionId;
    }
    const params = this._objectRequestParams('HEAD', name, options);
    params.successStatuses = [200, 304];

    result = await this.request(params);
  }

  const data = {
    meta: null,
    res: result.res,
    status: result.status
  };

  if ([200, 206].includes(result.status)) {
    Object.keys(result.headers).forEach((k) => {
      if (k.indexOf('x-oss-meta-') === 0) {
        if (!data.meta) {
          data.meta = {};
        }
        data.meta[k.substring(11)] = result.headers[k];
      }
    });
  }
  return data;
};
