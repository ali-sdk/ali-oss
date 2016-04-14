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

function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

function wrap(obj, options) {
  var client = new obj(options);
  var props = Object.keys(client);
  var protoProps = Object.keys(Object.getPrototypeOf(client));

  props.concat(protoProps).forEach(function(key) {
    if (isGeneratorFunction(client[key])) {
      this[key] = co.wrap(client[key]).bind(client);
    } else {
      this[key] = client[key];
    }
  }, this);
}

function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }

  wrap.call(this, OSS, options);
}

Client.STS = function STSClient(options) {
  if (!(this instanceof STSClient)) {
    return new STSClient(options);
  }

  wrap.call(this, OSS.STS, options);
}
