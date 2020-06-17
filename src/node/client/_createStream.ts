import fs from 'fs';
import is from 'is-type-of';
import { isFile } from '../../common/utils/isFile';
import { WebFileReadStream } from '../../common/utils/webFileReadStream';

export function _createStream(file, start, end) {
  if (is.readableStream(file)) {
    return file;
  } else if (isFile(file)) {
    return new WebFileReadStream(file.slice(start, end));
  } else if (is.string(file)) {
    return fs.createReadStream(file, {
      start,
      end: end - 1
    });
  }
  throw new Error('_createStream requires File/String.');
}
