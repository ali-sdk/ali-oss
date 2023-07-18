const { Stream } = require('stream');
const { isArray } = require('../lib/common/utils/isArray');

module.exports.string = function isString(obj) {
  return typeof obj === 'string';
};

module.exports.array = isArray;

module.exports.buffer = Buffer.isBuffer;

function isStream(obj) {
  return obj instanceof Stream;
}

module.exports.writableStream = function isWritableStream(obj) {
  return isStream(obj) && typeof obj._write === 'function' && typeof obj._writableState === 'object';
};
