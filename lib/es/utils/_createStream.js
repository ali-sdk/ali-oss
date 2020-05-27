import util from 'util';
import { Readable } from 'stream';
import isBlob from './isBlob';
import isFile from './isFile';

function WebFileReadStream(file, options) {
  if (!(this instanceof WebFileReadStream)) {
    return new WebFileReadStream(file, options);
  }

  Readable.call(this, options);

  this.file = file;
  this.reader = new FileReader();
  this.start = 0;
  this.finish = false;
  this.fileBuffer = null;
}
util.inherits(WebFileReadStream, Readable);

WebFileReadStream.prototype.readFileAndPush = function readFileAndPush(size) {
  if (this.fileBuffer) {
    let pushRet = true;
    while (pushRet && this.fileBuffer && this.start < this.fileBuffer.length) {
      const { start } = this;
      let end = start + size;
      end = end > this.fileBuffer.length ? this.fileBuffer.length : end;
      this.start = end;
      pushRet = this.push(this.fileBuffer.slice(start, end));
    }
  }
};

WebFileReadStream.prototype._read = function _read(size) {
  if ((this.file && this.start >= this.file.size) ||
      (this.fileBuffer && this.start >= this.fileBuffer.length) ||
      (this.finish) || (this.start === 0 && !this.file)) {
    if (!this.finish) {
      this.fileBuffer = null;
      this.finish = true;
    }
    this.push(null);
    return;
  }

  const defaultReadSize = 16 * 1024;
  size = size || defaultReadSize;

  const that = this;
  this.reader.onload = function onload(e) {
    that.fileBuffer = Buffer.from(new Uint8Array(e.target.result));
    that.file = null;
    that.readFileAndPush(size);
  };

  if (this.start === 0) {
    this.reader.readAsArrayBuffer(this.file);
  } else {
    this.readFileAndPush(size);
  }
};

export default function _createStream(file, start, end) {
  if (isBlob(file) || isFile(file)) {
    return new WebFileReadStream(file.slice(start, end));
  }

  throw new Error('_createStream requires File/String.');
}

