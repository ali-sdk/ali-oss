import { divideParts } from '../../common/utils/divideParts';
import { completeMultipartUpload } from './completeMultipartUpload';
import { handleUploadPart } from './handleUploadPart';
import { _makeCancelEvent } from '../utils/_makeCancelEvent';
/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
export async function resumeMultipart(this: any, checkpoint, options) {
  if (this.isCancel()) {
    throw _makeCancelEvent();
  }
  const {
    file, fileSize, partSize, uploadId, doneParts, name
  } = checkpoint;

  const partOffs = divideParts(fileSize, partSize);
  const numParts = partOffs.length;

  let uploadPartJob: any = function uploadPartJob(self, partNo) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        if (!self.isCancel()) {
          const pi = partOffs[partNo - 1];
          const data = {
            stream: self._createStream(file, pi.start, pi.end),
            size: pi.end - pi.start
          };

          const result = await handleUploadPart.call(self, name, uploadId, partNo, data);
          if (!self.isCancel()) {
            doneParts.push({
              number: partNo,
              etag: result.res.headers.etag
            });
            checkpoint.doneParts = doneParts;

            if (options.progress) {
              await options.progress(doneParts.length / numParts, checkpoint, result.res);
            }
          }
        }
        resolve();
      } catch (err) {
        err.partNum = partNo;
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
      await uploadPartJob(this, todo[i]);
    }
  } else {
    // upload in parallel
    const jobErr = await this._parallelNode(todo, parallel, uploadPartJob);

    if (this.isCancel()) {
      uploadPartJob = null;
      throw _makeCancelEvent();
    }

    if (jobErr && jobErr.length > 0) {
      jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${jobErr[0].partNum}`;
      throw jobErr[0];
    }
  }

  return await completeMultipartUpload.call(this, name, uploadId, doneParts, options);
}
