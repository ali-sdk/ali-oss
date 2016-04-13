/**
 * Copyright(c) rockuw and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var co = require('co');
var OSS = require('..');

module.exports = Client;

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

function wrap(obj, options) {
  this.client = new obj(options);

  var self = this;

  Object.keys(self.client.__proto__).map(function (k) {
    var fn = self.client[k];
    if (typeof fn == 'function') {
      self[k] = function () {
        var r = fn.apply(self.client, arguments);
        if (isGenerator(r)) {
          return co.wrap(fn).apply(self.client, arguments);
        }
        return r;
      };
    } else {
      self[k] = fn;
    }
  });
}

function Client(options) {
  wrap.call(this, OSS, options);
}

Client.STS = function STSClient(options) {
  wrap.call(this, OSS.STS, options);
}
