const { crc64, crc64File } = require('../../crc64');

module.exports = {
  checkCrc64: (content, oss_crc64) => {
    if (crc64(content) === oss_crc64) return true;
    return false;
  },
  checkCrc64Stream: (stream, callback) => {
    crc64File(stream, callback);
  }
};
