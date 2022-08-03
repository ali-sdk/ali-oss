const { check, check_stream } = require('./crc64');
const CRC64 = require('crc64-ecma182');

const checkCrc64 = function (content, oss_crc64) {
  if (CRC64.toUInt64String(check(content)) === oss_crc64) return true;
  return false;
};

const checkCrc64Stream = function (p, callback) {
  check_stream(p, (err, data) => {
    callback(err, CRC64.toUInt64String(data));
  });
};

const checkCrc64File = function (p, callback) {
  return CRC64.crc64File(p, true, callback);
};

module.exports = {
  checkCrc64,
  checkCrc64Stream,
  checkCrc64File
};
