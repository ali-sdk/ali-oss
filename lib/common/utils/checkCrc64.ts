import { crc64, crc64File } from '../../crc64';

export const checkCrc64 = (content, oss_crc64) => {
  if (crc64(content) === oss_crc64) return true;
  return false;
};
export const checkCrc64Stream = (stream, callback) => {
  crc64File(stream, callback);
};
