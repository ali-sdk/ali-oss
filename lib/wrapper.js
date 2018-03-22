

const co = require('co');
const OssClient = require('..');


function isGenerator(obj) {
  return obj && typeof obj.next === 'function' && typeof obj.throw === 'function';
}

function isGeneratorFunction(obj) {
  if (!obj) return false;

  const { constructor } = obj;
  if (!constructor) return false;
  if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction') return true;
  return isGenerator(constructor.prototype) || isGenerator(obj.prototype);
}

function wrap(ObjectClass, options) {
  const client = new ObjectClass(options);
  const props = Object.keys(client);
  const protoProps = Object.keys(Object.getPrototypeOf(client));

  props.concat(protoProps).forEach(function (key) {
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

module.exports = Client;

Client.STS = function STSClient(options) {
  if (!(this instanceof STSClient)) {
    return new STSClient(options);
  }

  wrap.call(this, OssClient.STS, options);
};
