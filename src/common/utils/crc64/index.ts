// @ts-ignore
const { check, check_stream } = require('./crc64.js');
const CRC64 = require('crc64-ecma182');

// @ts-ignore
export const checkCrc64 = (content: any, oss_crc64: any) => CRC64.toUInt64String(check(content)) === oss_crc64;

export const checkCrc64Stream = function (p, callback) {
  check_stream(p, (err, data) => {
    callback(err, CRC64.toUInt64String(data));
  });
};

export const checkCrc64File = function (p, callback) {
  return CRC64.crc64File(p, true, callback);
};
