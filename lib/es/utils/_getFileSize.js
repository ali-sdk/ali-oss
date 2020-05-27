import is from 'is-type-of';
import isBlob from './isBlob';
import isFile from './isFile';

export default async function _getFileSize(file) {
  if (is.buffer(file)) {
    return file.length;
  } else if (isBlob(file) || isFile(file)) {
    return file.size;
  }

  throw new Error('_getFileSize requires Buffer/File/String.');
}
