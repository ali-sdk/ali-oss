const crc64 = require('crc64-ecma182');
const _stream = require('stream');

function check() {
  let content;
  let init_crc = 0;
  const typeErrorMessage = 'Only (string|buffer) or (string|number, string|buffer) accepted!';
  if (arguments.length === 1) {
    content = arguments[0];
  } else if (arguments.length === 2) {
    content = arguments[0];
    init_crc = Number(arguments[1]);
  } else {
    throw new TypeError(typeErrorMessage);
  }

  if (typeof content === 'string' || Buffer.isBuffer(content)) {
    content = Buffer.from(content);
  } else {
    throw new TypeError(typeErrorMessage);
  }

  return crc64.crc64(content, init_crc);
}

function check_stream(stream, callback) {
  if (!(stream instanceof _stream.Stream)) throw new TypeError('Only (stream, callback) accepted!');
  let init_crc = 0;
  stream.on('data', chunk => {
    init_crc = check(chunk, init_crc);
  });
  stream.on('end', () => {
    callback(null, init_crc);
    try {
      if (stream) stream.close();
    } catch (e) {
      console.log(e);
    }
  });
  stream.on('error', err => {
    callback(err, null);
    try {
      if (stream) stream.close();
    } catch (e) {
      console.log(e);
    }
  });
}

module.exports = {
  check,
  check_stream
};
