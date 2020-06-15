import is from 'is-type-of';
import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';

export async function getFileSize(file) {
  if (is.buffer(file)) {
    return file.length;
  } else if (isBlob(file) || isFile(file)) {
    return file.size;
  }

  throw new Error('_getFileSize requires Buffer/File/Blob.');
}

