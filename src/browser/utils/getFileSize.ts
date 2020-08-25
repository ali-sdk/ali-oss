import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';
import { isBuffer } from '../../common/utils/isBuffer';

export async function getFileSize(file: any) {
  if (isBuffer(file)) {
    return file.length;
  } else if (isBlob(file) || isFile(file)) {
    return file.size;
  }

  throw new Error('getFileSize requires Buffer/File/Blob.');
}

