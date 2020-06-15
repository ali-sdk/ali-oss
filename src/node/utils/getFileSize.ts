import is from 'is-type-of';
import { isFile } from '../../common/utils/isFile';
import { statFile } from './statFile';

export async function getFileSize(file) {
  if (is.buffer(file)) {
    return file.length;
  } else if (isFile(file)) {
    return file.size;
  } if (is.string(file)) {
    const stat: any = await statFile(file);
    return stat.size;
  }

  throw new Error('_getFileSize requires Buffer/File/String.');
}
