import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';
import { WebFileReadStream } from '../../common/utils/webFileReadStream';

export function _createStream(file, start, end) {
  if (isBlob(file) || isFile(file)) {
    return new WebFileReadStream(file.slice(start, end));
  }

  throw new Error('_createStream requires File/Blob.');
}
