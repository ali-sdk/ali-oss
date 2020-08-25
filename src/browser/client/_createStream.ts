import { Readable } from 'stream';
import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';
import { WebFileReadStream } from '../../common/utils/webFileReadStream';
import { isBuffer } from '../../common/utils/isBuffer';

export function _createStream(file: any, start: number, end: number) {
  if (isBlob(file) || isFile(file)) {
    return new WebFileReadStream(file.slice(start, end));
  } else if (isBuffer(file)) {
    // we can't use Readable.from() since it is only support in Node v10
    const iterable = file.subarray(start, end);
    return new Readable({
      read() {
        this.push(iterable);
        this.push(null);
      }
    });
  }

  throw new Error('_createStream requires File/Blob/Buffer.');
}
