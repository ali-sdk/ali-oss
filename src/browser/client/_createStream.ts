import crypto from 'crypto';
import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';
import { isBuffer } from '../../common/utils/isBuffer';

export async function _createStream(
  file: any,
  start: number,
  end: number,
  useMd5 = false
) {
  const fileInfo: any = {};
  let fileContent;
  if (isBlob(file) || isFile(file)) {
    const _file = file.slice(start, end);
    fileContent = await _file.arrayBuffer();
    fileInfo.stream = Buffer.from(fileContent);
  } else if (isBuffer(file)) {
    fileInfo.stream = file.subarray(start, end);
    fileContent = fileInfo.stream;
  } else {
    throw new Error('_createStream requires File/Blob/Buffer.');
  }
  fileInfo.md5 =
    useMd5 && crypto.createHash('md5').update(fileContent).digest('base64');

  return fileInfo;
}
