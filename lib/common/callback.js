

exports.encodeCallback = function (options) {
  options.headers = options.headers || {};
  if (!Object.prototype.hasOwnProperty.call(options.headers, 'x-oss-callback')) {
    if (options.callback) {
      const json = {
        callbackUrl: encodeURI(options.callback.url),
        callbackBody: options.callback.body,
      };
      if (options.callback.host) {
        json.callbackHost = options.callback.host;
      }
      if (options.callback.contentType) {
        json.callbackBodyType = options.callback.contentType;
      }
      const callback = new Buffer(JSON.stringify(json)).toString('base64');
      options.headers['x-oss-callback'] = callback;

      if (options.callback.customValue) {
        const callbackVar = {};
        Object.keys(options.callback.customValue).forEach((key) => {
          callbackVar[`x:${key}`] = options.callback.customValue[key];
        });
        options.headers['x-oss-callback-var'] = new Buffer(JSON.stringify(callbackVar)).toString('base64');
      }
    }
  }
};
