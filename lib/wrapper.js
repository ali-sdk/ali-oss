'use strict';

var co = require('co');
var OssClient = require('..');

module.exports = Client;

function isGenerator(obj) {
  return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

function isGeneratorFunction(obj) {
  if (!obj) return false;

  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype) || isGenerator(obj.prototype);
}

function wrap(ObjectClass, options) {
  var client = new ObjectClass(options);
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

  wrap.call(this, OssClient, options);
}

Client.STS = function STSClient(options) {
  if (!(this instanceof STSClient)) {
    return new STSClient(options);
  }

  wrap.call(this, OssClient.STS, options);
}
