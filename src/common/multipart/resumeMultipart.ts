/* eslint-disable no-async-promise-executor */
import { divideParts } from '../../common/utils/divideParts';
import { completeMultipartUpload } from './completeMultipartUpload';
import { handleUploadPart } from './handleUploadPart';
import { _makeCancelEvent } from '../utils/_makeCancelEvent';
import { _makeAbortEvent } from '../utils/_makeAbortEvent';
import { _parallel } from '../utils/_parallel';
import { Checkpoint } from '../../types/params';

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
export async function resumeMultipart(this: any, checkpoint: Checkpoint, options: any = {}) {
  if (this.isCancel()) {
    throw _makeCancelEvent();
  }
  const { file, fileSize, partSize, uploadId, doneParts, name } = checkpoint;

  const partOffs = divideParts(fileSize, partSize);
  const numParts = partOffs.length;

  let uploadPartJob: any = partNo => {
    return new Promise(async (resolve, reject) => {
      let hasUploadPart = checkpoint.doneParts.find(_ => _.number === partNo);
      if (hasUploadPart) {
        resolve(hasUploadPart);
        return;
      }
      try {
        if (!this.isCancel()) {
          const pi = partOffs[partNo - 1];
          const stream = await this._createStream(file, pi.start, pi.end);
          const data = {
            stream,
            size: pi.end - pi.start
          };

          if (stream && stream.pipe) {
            if (Array.isArray(this.multipartUploadStreams)) {
              this.multipartUploadStreams.push(data.stream);
            } else {
              this.multipartUploadStreams = [data.stream];
            }
            const removeStreamFromMultipartUploadStreams = () => {
              if (!stream.destroyed) {
                stream.destroy();
              }
              if (!Array.isArray(this.multipartUploadStreams)) return;
              const index = this.multipartUploadStreams.indexOf(stream);
              if (index !== -1) {
                this.multipartUploadStreams.splice(index, 1);
              }
            };
            stream.on('close', removeStreamFromMultipartUploadStreams);
            stream.on('error', removeStreamFromMultipartUploadStreams);
          }

          let result;
          try {
            result = await handleUploadPart.call(this, name, uploadId, partNo, data, options);
          } catch (error) {
            if (typeof stream.destroy === 'function') {
              stream.destroy();
            }
            throw error;
          }

          hasUploadPart = checkpoint.doneParts.find(_ => _.number === partNo);
          if (hasUploadPart) {
            resolve(hasUploadPart);
            return;
          }
          if (!this.isCancel()) {
            doneParts.push({
              number: partNo,
              etag: result.res.headers.etag
            });
            checkpoint.doneParts = doneParts;

            if (options.progress) {
              await options.progress(doneParts.length / (numParts + 1), checkpoint, result.res);
            }

            resolve({
              number: partNo,
              etag: result.res.headers.etag
            });
          }
        }
        resolve();
      } catch (err) {
        err.partNum = partNo;
        if (err.status === 404) {
          reject(_makeAbortEvent());
        }
        reject(err);
      }
    });
  };

  const all = Array.from(new Array(numParts), (_x, i) => i + 1);
  const done = doneParts.map(p => p.number);
  const todo = all.filter(p => done.indexOf(p) < 0);

  const defaultParallel = 5;
  const parallel = options.parallel || defaultParallel;

  if (this.checkBrowserAndVersion('Internet Explorer', '10') || parallel === 1) {
    for (let i = 0; i < todo.length; i++) {
      if (this.isCancel()) {
        throw _makeCancelEvent();
      }
      /* eslint no-await-in-loop: [0] */
      await uploadPartJob(todo[i]);
    }
  } else {
    // upload in parallel
    const jobErr = await _parallel.call(
      this,
      todo,
      parallel,
      value => new Promise((resolve, reject) => {
          uploadPartJob(value)
            .then(() => {
              resolve();
            })
            .catch(reject);
        })
    );

    if (this.isCancel()) {
      uploadPartJob = null;
      throw _makeCancelEvent();
    }

    if (jobErr && jobErr.length > 0) {
      const abortEvent = jobErr.find(err => err.name === 'abort');
      if (abortEvent) throw abortEvent;

      jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${
        jobErr[0].partNum
      }`;
      throw jobErr[0];
    }
  }

  return await completeMultipartUpload.call(this, name, uploadId, doneParts, options);
}
