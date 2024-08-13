exports.encodeCallback = function encodeCallback(reqParams, options) {
  reqParams.headers = reqParams.headers || {};
  if (!Object.prototype.hasOwnProperty.call(reqParams.headers, 'x-oss-callback')) {
    if (options.callback) {
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
      const callback = Buffer.from(JSON.stringify(json)).toString('base64');
      reqParams.headers['x-oss-callback'] = callback;

      if (options.callback.customValue) {
        const callbackVar = {};
        Object.keys(options.callback.customValue).forEach(key => {
          callbackVar[`x:${key}`] = options.callback.customValue[key].toString();
        });
        reqParams.headers['x-oss-callback-var'] = Buffer.from(JSON.stringify(callbackVar)).toString('base64');
      }
    }
  }
};
