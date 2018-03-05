'use strict';


exports.encodeCallback = function(options) {
  options.headers = options.headers || {};
  if (!options.headers.hasOwnProperty('x-oss-callback')) {
    if (options.callback) {
      var json = {
        callbackUrl: encodeURI(options.callback.url),
        callbackBody: options.callback.body
      };
      if (options.callback.host) {
        json.callbackHost = options.callback.host;
      }
      if (options.callback.contentType) {
        json.callbackBodyType = options.callback.contentType;
      }
      var callback = new Buffer(JSON.stringify(json)).toString('base64');
      options.headers['x-oss-callback'] = callback;

      if (options.callback.customValue) {
        var callbackVar = {};
        for (var key in options.callback.customValue) {
          callbackVar['x:' + key] = options.callback.customValue[key];
        }
        options.headers['x-oss-callback-var'] = new Buffer(JSON.stringify(callbackVar)).toString('base64');
      }
    }
  }
};