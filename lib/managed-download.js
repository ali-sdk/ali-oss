"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multipartDownload = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const crc64_ecma182_1 = require("crc64-ecma182");
const isObject_1 = require("./common/utils/isObject");
const crc64_1 = require("./common/utils/crc64");
var EDownloadStatus;
(function (EDownloadStatus) {
    EDownloadStatus[EDownloadStatus["READY"] = 0] = "READY";
    EDownloadStatus[EDownloadStatus["PENDING"] = 1] = "PENDING";
    EDownloadStatus[EDownloadStatus["OK"] = 2] = "OK";
})(EDownloadStatus || (EDownloadStatus = {}));
function md5(content) {
    return crypto_1.default.createHash('md5').update(Buffer.from(content, 'utf8')).digest('base64');
}
function getTempFilePath(p) {
    return `${p}.temp`;
}
function getCheckpointFilePath(p, versionId) {
    return `${p + (versionId ? `-${versionId}` : '')}.cp.json`;
}
function getDownloadParts(objectSize, partSize, ranges) {
    const parts = [];
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
function getIntervalsRange(headers, contentLength) {
    let intervals = [];
    if (isObject_1.isObject(headers)) {
        for (const key in headers) {
            if (key.toLocaleLowerCase() === 'range') {
                const [unit, ranges] = headers[key].split('=');
                if (unit !== 'bytes') {
                    throw new Error('Range Not Satisfiable');
                }
                if (!ranges)
                    return null;
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
    if (intervals.length === 0)
        return null;
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const interval of intervals) {
        if (merged.length === 0 || ((merged[merged.length - 1][1] + 1) < interval[0])) {
            merged.push(interval);
        }
        else {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], interval[1]);
        }
    }
    if (merged[0][0] < 0 || merged[merged.length - 1][1] >= contentLength) {
        throw new Error('Range Not Satisfiable');
    }
    return merged;
}
class DownloadCheckPoint {
    constructor(objectKey, filePath, fileMeta, options) {
        this.objectKey = objectKey;
        this.filePath = filePath;
        this.tempDownloadFilePath = getTempFilePath(filePath);
        this.tempCheckpointPath = getCheckpointFilePath(objectKey, options.versionId);
        this.versionId = fileMeta['x-oss-version-id'] || null;
        this.objectStat = {
            size: +fileMeta['content-length'],
            etag: fileMeta.etag,
            lastModified: fileMeta['last-modified']
        };
        this.parallel = options.parallel;
        this.partSize = options.partSize;
        const uRanges = getIntervalsRange(options.headers, this.objectStat.size);
        this.parts = getDownloadParts(this.objectStat.size, options.partSize, uRanges);
        this.MD5 = '';
        if (uRanges !== null || !fileMeta['x-oss-hash-crc64ecma']) {
            this.enableCRC64 = false;
        }
        else {
            this.enableCRC64 = options.enableCRC64;
        }
        this.CRC = fileMeta['x-oss-hash-crc64ecma'];
    }
    static async load(client, objectKey, filePath, options) {
        const { res: { headers } } = await client.getObjectMeta(objectKey, options);
        const checkpoint = new DownloadCheckPoint(objectKey, filePath, headers, options);
        if (!fs_1.default.existsSync(checkpoint.tempDownloadFilePath)) {
            return checkpoint;
        }
        try {
            const localCheckpoint = JSON.parse(fs_1.default.readFileSync(checkpoint.tempCheckpointPath, { encoding: 'utf8' }));
            DownloadCheckPoint.validate(localCheckpoint, headers);
            return Object.assign(checkpoint, localCheckpoint);
        }
        catch (e) {
            checkpoint.removeTempFiles();
            return checkpoint;
        }
    }
    static validate(content, header) {
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
        if (fs_1.default.existsSync(this.tempDownloadFilePath)) {
            fs_1.default.unlinkSync(this.tempDownloadFilePath);
        }
        if (fs_1.default.existsSync(this.tempCheckpointPath)) {
            fs_1.default.unlinkSync(this.tempCheckpointPath);
        }
    }
    dump() {
        const copy = Object.assign(this, {
            MD5: ''
        });
        copy.MD5 = md5(JSON.stringify(copy));
        fs_1.default.writeFileSync(this.tempCheckpointPath, JSON.stringify(copy));
    }
    validateDownloadCRC64() {
        if (!this.parts.every(p => p.status === EDownloadStatus.OK)) {
            throw new Error('Currently downloading');
        }
        let actualCRC = this.parts[0].crc64;
        for (let i = 1; i < this.parts.length; i++) {
            actualCRC = crc64_1.CRC64Combine(actualCRC, this.parts[i].crc64, +(this.parts[i].end - this.parts[i].start + 1));
        }
        if (actualCRC !== this.CRC) {
            throw new Error(`CRC64 check failed from ${this.objectKey} to ${this.filePath}`);
        }
    }
    complete() {
        fs_1.default.renameSync(this.tempDownloadFilePath, this.filePath);
        if (fs_1.default.existsSync(this.tempCheckpointPath)) {
            fs_1.default.unlinkSync(this.tempCheckpointPath);
        }
    }
    getReadyTasks() {
        return this.parts.filter(p => p.status === EDownloadStatus.READY);
    }
    getFinishedTasks() {
        return this.parts.filter(p => p.status === EDownloadStatus.OK);
    }
}
async function multipartDownload(objectKey, filePath, options = {}) {
    if (options.enableCRC64 && !crc64_1.SUPPORT_BIGINT) {
        console.warn('The current environment does not support BigInt, options.enableCRC64 has been automatically set to false!');
    }
    options = Object.assign({
        parallel: 5,
        partSize: 1024 * 1024,
        enableCRC64: crc64_1.SUPPORT_BIGINT
    }, options);
    const downloadCheckpoint = await DownloadCheckPoint.load(this, objectKey, filePath, options);
    const tempFileFd = fs_1.default.openSync(downloadCheckpoint.tempDownloadFilePath, 'w+');
    let pendingSourceStreams = [];
    let paused = false;
    const download = async () => {
        return new Promise((resolve, reject) => {
            let pendWorkerCount = 0;
            const shouldPause = () => {
                if (paused) {
                    throw this._makeCancelEvent();
                }
                return false;
            };
            function performNextWorkPart() {
                return !shouldPause() && downloadCheckpoint.parts.find(p => p.status === EDownloadStatus.READY);
            }
            const downloadNextPart = async () => {
                const part = performNextWorkPart();
                if (!part)
                    return;
                part.status = EDownloadStatus.PENDING;
                const writeStream = fs_1.default.createWriteStream(downloadCheckpoint.tempDownloadFilePath, {
                    start: part.offset,
                    fd: tempFileFd,
                    autoClose: false,
                });
                const { stream: readStream } = await this.getStream(objectKey, {
                    versionId: options.versionId,
                    headers: {
                        Range: `bytes=${part.start}-${part.end}`,
                        'x-oss-range-behavior': 'standard',
                        'response-cache-control': 'no-store'
                    }
                });
                if (shouldPause())
                    return;
                await new Promise((resolve_1) => {
                    pendingSourceStreams.push(readStream);
                    function removeSelf() {
                        const index = pendingSourceStreams.indexOf(readStream);
                        if (index !== -1) {
                            pendingSourceStreams.splice(index, 1);
                        }
                    }
                    const ret = Buffer.alloc(8);
                    if (downloadCheckpoint.enableCRC64) {
                        readStream.on('data', (chunk) => {
                            crc64_ecma182_1.crc64(chunk, ret);
                        });
                    }
                    readStream.on('end', () => {
                        removeSelf();
                        part.status = EDownloadStatus.OK;
                        if (downloadCheckpoint.enableCRC64) {
                            part.crc64 = crc64_ecma182_1.toUInt64String(ret);
                        }
                        downloadCheckpoint.dump();
                        resolve_1(undefined);
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
                            reject(this._makeCancelEvent());
                        }
                    });
                    readStream.pipe(writeStream);
                });
            };
            function scheduler() {
                for (; pendWorkerCount < options.parallel && performNextWorkPart(); pendWorkerCount++) {
                    // eslint-disable-next-line no-loop-func
                    downloadNextPart().then(() => {
                        pendWorkerCount -= 1;
                        const doneParts = downloadCheckpoint.getFinishedTasks();
                        if (typeof options.progress === 'function') {
                            options.progress(doneParts.length, downloadCheckpoint.parts.length);
                        }
                        if (doneParts.length === downloadCheckpoint.parts.length) {
                            resolve(undefined);
                        }
                        else {
                            scheduler();
                        }
                    });
                }
            }
            scheduler();
        });
    };
    if (typeof options.ref === 'function') {
        options.ref({
            cancel(needDestoryed = false) {
                if (paused)
                    return;
                paused = true;
                pendingSourceStreams.forEach(readable => {
                    readable.destroy();
                });
                fs_1.default.closeSync(tempFileFd);
                pendingSourceStreams = [];
                if (needDestoryed) {
                    downloadCheckpoint.removeTempFiles();
                }
            },
        });
    }
    await download();
    downloadCheckpoint.validateDownloadCRC64();
    fs_1.default.closeSync(tempFileFd);
    downloadCheckpoint.complete();
    paused = true;
}
exports.multipartDownload = multipartDownload;
