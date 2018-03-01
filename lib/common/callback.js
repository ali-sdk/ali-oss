'use strict';


exports.encodeCallback = function(options) {
  options.headers = options.headers || {};
  if (!options.headers.hasOwnProperty('x-oss-callback')) {
    if (options.callback) {
      var callback = new Buffer(JSON.stringify(options.callback)).toString('base64');
      options.headers['x-oss-callback'] = callback;

      if (options.callbackVar) {
        var callbackVar = {};
        for (var key in options.callbackVar) {
          callbackVar['x:' + key] = options.callbackVar[key];
        }
        options.headers['x-oss-callback-var'] = new Buffer(JSON.stringify(callbackVar)).toString('base64');
      }
    }
  }
};