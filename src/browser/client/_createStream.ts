import { Buffer } from 'buffer';
import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';
import { isBuffer } from '../../common/utils/isBuffer';

export async function _createStream(
  file: Blob | File | Buffer,
  start: number,
  end: number,
): Promise<Buffer> {
  if (isBlob(file) || isFile(file)) {
    const _file = file.slice(start, end);
    const fileContent = await _file.arrayBuffer();
    return Buffer.from(fileContent);
  } else if (isBuffer(file)) {
    return file.subarray(start, end);
  } else {
    throw new Error('_createStream requires File/Blob/Buffer.');
  }
}
