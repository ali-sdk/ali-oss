import crypto from 'crypto';
import fs from 'fs';
import { Readable } from 'stream';
import { crc64, toUInt64String } from 'crc64-ecma182';
import { isObject } from '../../common/utils/isObject';
import { CRC64Combine, SUPPORT_BIGINT } from '../../common/utils/crc64';
import { MultipartDownload, MultipartDownloadRuntime } from '../../types/params';
import { _makeCancelEvent } from '../../common/utils/_makeCancelEvent';

enum EDownloadStatus {
  READY,
  PENDING,
  OK,
}

interface IDownloadPart {
  index: number,
  start: number,
  end: number,
  offset: number,
  status: EDownloadStatus,
  crc64: string,
}

function md5(content) {
  return crypto.createHash('md5').update(Buffer.from(content, 'utf8')).digest('base64');
}

function getTempFilePath(p) {
  return `${p}.temp`;
}
function getCheckpointFilePath(p, versionId) {
  return `${p + (versionId ? `-${versionId}` : '')}.cp.json`;
}

function getDownloadParts(objectSize: number, partSize: number, ranges: Array<[number, number]> | null): IDownloadPart[] {
  const parts: IDownloadPart[] = [];
  if (!ranges) {
    ranges = [[0, objectSize - 1]];
  }
  let index = 0;
  let offset = 0;
  ranges.forEach(range => {
    let start = range[0];
    const end = range[1];
    while (start <= end) {
      const currentPartEnd = Math.min(start + partSize - 1, end);
      parts.push({
        index,
        start,
        end: currentPartEnd,
        offset,
        status: EDownloadStatus.READY,
        crc64: ''
      });
      index++;
      offset += (currentPartEnd - start + 1);
      start = currentPartEnd + 1;
    }
  });
  return parts;
}

// support http-header Range
function getIntervalsRange(headers: object | undefined, contentLength: number) {
  let intervals: Array<[number, number]> = [];
  if (isObject(headers)) {
    for (const key in headers) {
      if (key.toLocaleLowerCase() === 'range') {
        const [unit, ranges] = headers[key].split('=');
        if (unit !== 'bytes') {
          throw new Error('Range Not Satisfiable');
        }
        if (!ranges) return null;
        intervals = ranges.split(',').map(str => {
          const [start, end] = str.split('-');
          if (!Number.isInteger(+start) || !Number.isInteger(+end)) {
            throw new Error('Range Not Satisfiable');
          }
          return ([+start, end === '' ? contentLength - 1 : +end]);
        });
        break;
      }
    }
  }
  if (intervals.length === 0) return null;
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const interval of intervals) {
    if (merged.length === 0 || ((merged[merged.length - 1][1] + 1) < interval[0])) {
      merged.push(interval);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1]);
    }
  }
  if (merged[0][0] < 0 || merged[merged.length - 1][1] >= contentLength) {
    throw new Error('Range Not Satisfiable');
  }
  return merged;
}

class DownloadCheckPoint {
  objectKey: string;

  objectStat: {
    size: number;
    etag: string;
    lastModified: string;
  };

  parts: IDownloadPart[];

  filePath: string;

  tempDownloadFilePath: string;

  tempCheckpointPath: string;

  versionId: string | null;

  MD5: string;

  enableCRC64: boolean;

  CRC: string;

  parallel: number;

  partSize: number;

  constructor(objectKey: string, filePath: string, fileMeta: any, options: MultipartDownloadRuntime) {
    this.objectKey = objectKey;
    this.filePath = filePath;
    this.tempDownloadFilePath = getTempFilePath(filePath);
    this.tempCheckpointPath = getCheckpointFilePath(objectKey, options.versionId);
    this.versionId = fileMeta['x-oss-version-id'] as string || null;
    this.objectStat = {
      size: +fileMeta['content-length'],
      etag: fileMeta.etag as string,
      lastModified: fileMeta['last-modified']
    };
    this.parallel = options.parallel;
    this.partSize = options.partSize;

    const uRanges = getIntervalsRange(options.headers, this.objectStat.size);
    this.parts = getDownloadParts(this.objectStat.size, options.partSize, uRanges);
    this.MD5 = '';
    if (uRanges !== null || !fileMeta['x-oss-hash-crc64ecma']) {
      this.enableCRC64 = false;
    } else {
      this.enableCRC64 = options.enableCRC64;
    }
    this.CRC = fileMeta['x-oss-hash-crc64ecma'];
  }

  static async load(client: any, objectKey: string, filePath: string, options: MultipartDownloadRuntime): Promise<DownloadCheckPoint> {
    const { res: { headers } } = await client.getObjectMeta(objectKey, options);
    const checkpoint = new DownloadCheckPoint(objectKey, filePath, headers, options);
    if (!fs.existsSync(checkpoint.tempDownloadFilePath)) {
      return checkpoint;
    }
    try {
      const localCheckpoint = JSON.parse(
        fs.readFileSync(
          checkpoint.tempCheckpointPath, { encoding: 'utf8' }
        )
      );
      DownloadCheckPoint.validate(localCheckpoint, headers);
      return Object.assign(checkpoint, localCheckpoint);
    } catch (e) {
      checkpoint.removeTempFiles();
      return checkpoint;
    }
  }

  static validate(content: DownloadCheckPoint, header: any) {
    const copy = Object.assign({}, this, { MD5: '' });
    const cpFileMD5 = md5(JSON.stringify(copy));
    if (content.MD5 !== cpFileMD5) {
      throw new Error('The checkpoint file has been changed!');
    }
    if (content.objectStat.size !== +header['content-length']
      || content.objectStat.etag !== header.etag
      || content.objectStat.lastModified !== header['last-modified']) {
      throw new Error('The checkpoint file or oss file has been changed!');
    }
  }

  removeTempFiles() {
    if (fs.existsSync(this.tempDownloadFilePath)) {
      fs.unlinkSync(this.tempDownloadFilePath);
    }
    if (fs.existsSync(this.tempCheckpointPath)) {
      fs.unlinkSync(this.tempCheckpointPath);
    }
  }

  dump() {
    const copy = Object.assign(this, {
      MD5: ''
    });
    copy.MD5 = md5(JSON.stringify(copy));
    fs.writeFileSync(this.tempCheckpointPath, JSON.stringify(copy));
  }

  validateDownloadCRC64() {
    if (!this.enableCRC64) {
      return;
    }
    if (!this.parts.every(p => p.status === EDownloadStatus.OK)) {
      throw new Error('Currently downloading');
    }
    let actualCRC = this.parts[0].crc64;
    for (let i = 1; i < this.parts.length; i++) {
      actualCRC = CRC64Combine(actualCRC, this.parts[i].crc64, +(this.parts[i].end - this.parts[i].start + 1));
    }
    if (actualCRC !== this.CRC) {
      throw new Error(`CRC64 check failed from ${this.objectKey} to ${this.filePath}`);
    }
  }

  complete() {
    fs.renameSync(this.tempDownloadFilePath, this.filePath);
    if (fs.existsSync(this.tempCheckpointPath)) {
      fs.unlinkSync(this.tempCheckpointPath);
    }
  }

  getReadyTasks() {
    return this.parts.filter(p => p.status === EDownloadStatus.READY);
  }

  getFinishedTasks() {
    return this.parts.filter(p => p.status === EDownloadStatus.OK);
  }
}

export async function multipartDownload(
  this: any,
  objectKey: string,
  filePath: string,
  options: MultipartDownload = {}
) {
  const originEnableCRC64 = options.enableCRC64;
  options = Object.assign({
    parallel: 5,
    partSize: 1024 * 1024,
    enableCRC64: options.enableCRC64 && SUPPORT_BIGINT,
    disabledWarning: true
  }, options);
  if (originEnableCRC64 && !SUPPORT_BIGINT && !options.disabledWarning) {
    console.warn('The current environment does not support BigInt, options.enableCRC64 has been automatically set to false!');
  }

  const downloadCheckpoint = await DownloadCheckPoint.load(this, objectKey, filePath, options as MultipartDownloadRuntime);
  const tempFileFd = fs.openSync(downloadCheckpoint.tempDownloadFilePath, 'w+');

  let pendingSourceStreams: Readable[] = [];

  let paused = false;
  const download = () => {
    let pendWorkerCount = 0;
    const shouldPause = () => {
      if (paused) {
        throw _makeCancelEvent();
      }
      return false;
    };
    function performNextWorkPart() {
      return !shouldPause() && downloadCheckpoint.parts.find(p => p.status === EDownloadStatus.READY);
    }
    const downloadNextPart = async () => {
      const part = performNextWorkPart();
      if (!part) {
        return;
      }
      part.status = EDownloadStatus.PENDING;
      const writeStream = fs.createWriteStream(downloadCheckpoint.tempDownloadFilePath, {
        start: part.offset,
        fd: tempFileFd,
        autoClose: false,
      });
      const { stream: readStream, res: partResp } = await this.getStream(objectKey, {
        versionId: options.versionId,
        headers: {
          Range: `bytes=${part.start}-${part.end}`,
          'x-oss-range-behavior': 'standard',
          'response-cache-control': 'no-store'
        }
      });
      if (shouldPause()) {
        throw (_makeCancelEvent());
      }
      return new Promise((resolve, reject) => {
        function removeSelf() {
          const index = pendingSourceStreams.indexOf(readStream);
          if (index !== -1) {
            pendingSourceStreams.splice(index, 1);
          }
        }
        const ret = Buffer.alloc(8);
        readStream.pause();
        if (downloadCheckpoint.enableCRC64) {
          readStream.on('data', (chunk) => {
            crc64(chunk, ret);
          });
        }
        readStream.on('end', () => {
          removeSelf();
          part.status = EDownloadStatus.OK;
          if (downloadCheckpoint.enableCRC64) {
            part.crc64 = toUInt64String(ret);
          }
          downloadCheckpoint.dump();
          resolve(partResp);
        });
        readStream.on('error', (e) => {
          removeSelf();
          part.status = EDownloadStatus.READY;
          downloadCheckpoint.dump();
          reject(e);
        });
        readStream.on('close', () => {
          if (paused) {
            removeSelf();
            part.status = EDownloadStatus.READY;
            downloadCheckpoint.dump();
            reject(_makeCancelEvent());
          }
        });
        pendingSourceStreams.push(readStream);
        readStream.pipe(writeStream);
      });
    };
    function scheduler(resolve, reject) {
      for (; pendWorkerCount < (options as MultipartDownloadRuntime).parallel && performNextWorkPart(); pendWorkerCount++) {
        // eslint-disable-next-line no-loop-func
        downloadNextPart().then((partResp: any) => {
          if (!partResp) return;
          pendWorkerCount -= 1;
          const doneParts = downloadCheckpoint.getFinishedTasks();
          if (typeof options.progress === 'function') {
            options.progress(doneParts.length, downloadCheckpoint.parts.length, partResp);
          }
          if (doneParts.length === downloadCheckpoint.parts.length) {
            resolve(null);
          } else {
            scheduler(resolve, reject);
          }
        }).catch((e) => {
          if (e) {
            reject(e);
          }
        });
      }
    }
    return new Promise((resolve, reject) => {
      scheduler(resolve, reject);
    });
  };

  if (typeof options.ref === 'function') {
    options.ref({
      cancel(needDestoryed = false) {
        if (paused) return;
        paused = true;
        pendingSourceStreams.forEach(readable => {
          readable.destroy();
        });
        fs.closeSync(tempFileFd);
        pendingSourceStreams = [];
        if (needDestoryed) {
          downloadCheckpoint.removeTempFiles();
        }
      },
    });
  }

  await download();
  downloadCheckpoint.validateDownloadCRC64();
  fs.closeSync(tempFileFd);
  downloadCheckpoint.complete();
  paused = true;
}
