import { isFile } from '../../common/utils/isFile';
import { isBuffer } from '../../common/utils/isBuffer';
import { statFile } from './statFile';
import { isString } from '../../common/utils/isString';

export async function getFileSize(file: any) {
  if (isBuffer(file)) {
    return file.length;
  } else if (isFile(file)) {
    return file.size;
  } if (isString(file)) {
    const stat = await statFile(file);
    return stat.size;
  }

  throw new Error('getFileSize requires Buffer/File/String.');
}
