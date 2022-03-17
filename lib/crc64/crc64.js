const path = require('path');
const os = require('os');
const _stream = require('stream');

const _crc64 = require(path.join(__dirname, `/dist/${os.arch()}-${os.platform()}/Release/crc64`));

function check() {
  let init_crc = 0;
  let content = null;
  const typeErrorMessage = 'Only (string|buffer) or (string|number, string|bufffer) accepted!';
  if (arguments.length === 1) {
    content = arguments[0];
  } else if (arguments.length === 2) {
    init_crc = arguments[0];
    content = arguments[1];
  } else {
    throw new TypeError(typeErrorMessage);
  }
  if (typeof init_crc === 'number') {
    init_crc = init_crc.toString();
  }
  if (typeof init_crc !== 'string') {
    throw new TypeError(typeErrorMessage);
  }
  if (typeof content === 'string' || Buffer.isBuffer(content)) content = Buffer.from(content);
  else {
    throw new TypeError(typeErrorMessage);
  }
  return _crc64.get(init_crc, content);
}

function check_stream(stream, callback) {
  if (!(stream instanceof _stream.Stream)) throw new TypeError('Only (stream, callback) accepted!');
  let init_crc = 0;
  stream.on('data', chunk => {
    init_crc = check(init_crc, chunk);
  });
  stream.on('end', () => {
    callback(null, init_crc);
    try {
      if (stream) stream.close();
    } catch (e) {}
  });
  stream.on('error', err => {
    callback(err, null);
    try {
      if (stream) stream.close();
    } catch (e) {}
  });
}

module.exports = {
  check,
  check_stream
};
