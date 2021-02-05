/* eslint-disable no-async-promise-executor */
import { divideParts } from '../../common/utils/divideParts';
import { _makeCancelEvent } from '../../common/utils/_makeCancelEvent';
import { _makeAbortEvent } from '../../common/utils/_makeAbortEvent';
import { _parallel } from '../../common/utils/_parallel';
import { Checkpoint, DoneParts, MultipartUploadOptions } from '../../types/params';
import { _createStream } from '../client/_createStream';
import { checkBrowserAndVersion } from '../../common/utils/checkBrowserAndVersion';
import { injectDependency } from '../utils/injectDependency';
import { OSS } from '../core';

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
export async function resumeMultipart(
  this: OSS,
  checkpoint: Checkpoint,
  options: MultipartUploadOptions = {}
) {
  injectDependency(this, 'resumeMultipart');
  if (this.isCancel()) {
    throw _makeCancelEvent();
  }
  const { file, fileSize, partSize, uploadId, doneParts, name } = checkpoint;

  const partOffs = divideParts(fileSize, partSize);
  const numParts = partOffs.length;

  let uploadPartJob: null | ((p: number) => Promise<void | DoneParts>) = partNo => {
    return new Promise(async (resolve, reject) => {
      let hasUploadPart = checkpoint.doneParts.find(_ => _.number === partNo);
      if (hasUploadPart) {
        resolve(hasUploadPart);
        return;
      }
      try {
        if (!this.isCancel()) {
          const pi = partOffs[partNo - 1];
          const result = await this.uploadPart(name, uploadId, partNo, file, pi.start, pi.end, options)

          hasUploadPart = checkpoint.doneParts.find(_ => _.number === partNo);
          if (hasUploadPart) {
            resolve(hasUploadPart);
            return;
          }
          if (!this.isCancel()) {
            doneParts.push({
              number: partNo,
              etag: result.res.headers.etag as string,
            });
            checkpoint.doneParts = doneParts;

            if (options.progress) {
              await options.progress(
                doneParts.length / numParts,
                checkpoint,
                result.res
              );
            }

            resolve({
              number: partNo,
              etag: result.res.headers.etag as string,
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

  if (
    checkBrowserAndVersion('Internet Explorer', '10') ||
    parallel === 1
  ) {
    for (let i = 0; i < todo.length; i++) {
      if (this.isCancel()) {
        throw _makeCancelEvent();
      }
      /* eslint no-await-in-loop: [0] */
      await uploadPartJob(todo[i]);
    }
  } else {
    // upload in parallel
    const jobErr = await _parallel.call(this, todo, parallel, uploadPartJob);

    if (this.isCancel()) {
      uploadPartJob = null;
      throw _makeCancelEvent();
    }

    if (jobErr && jobErr.length > 0) {
      const abortEvent = jobErr.find(err => err.name === 'abort');
      if (abortEvent) throw abortEvent;

      jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${jobErr[0].partNum
        }`;
      throw jobErr[0];
    }
  }

  return await this.completeMultipartUpload(
    name,
    uploadId,
    doneParts,
    options
  );
}
