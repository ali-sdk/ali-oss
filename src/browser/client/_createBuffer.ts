import { Buffer } from 'buffer';
import { isBlob } from '../../common/utils/isBlob';
import { isFile } from '../../common/utils/isFile';
import { isBuffer } from '../../common/utils/isBuffer';

function getBuffer(file: File | Blob) {
  // Some browsers do not support Blob.prototype.arrayBuffer, such as IE
  if (file.arrayBuffer) return file.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target!.result as ArrayBuffer);
    };
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsArrayBuffer(file);
  });
}

export async function _createBuffer(
  file: Blob | File | Buffer,
  start: number,
  end: number,
): Promise<Buffer> {
  if (isBlob(file) || isFile(file)) {
    const _file = file.slice(start, end);
    const fileContent = await getBuffer(_file);
    return Buffer.from(fileContent);
  } else if (isBuffer(file)) {
    return file.subarray(start, end);
  } else {
    throw new Error('_createBuffer requires File/Blob/Buffer.');
  }
}
