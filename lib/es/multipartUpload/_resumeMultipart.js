import copy from 'copy-to';
import completeMultipartUpload from '../completeMultipartUpload';
import _uploadPart from './_uploadPart';
import _divideParts from '../utils/_divideParts';
import _parallel from '../utils/_parallel';
import _makeCancelEvent from '../utils/_makeCancelEvent';
import _createStream from '../utils/_createStream';

/*
 * Resume multipart upload from checkpoint. The checkpoint will be
 * updated after each successful part upload.
 * @param {Object} checkpoint the checkpoint
 * @param {Object} options
 */
export default async function _resumeMultipart(client, checkpoint, options) {
  if (client.options.cancelFlag) {
    throw _makeCancelEvent();
  }
  const {
    file, fileSize, partSize, uploadId, doneParts, name
  } = checkpoint;

  const internalDoneParts = [];

  if (doneParts.length > 0) {
    copy(doneParts).to(internalDoneParts);
  }

  const partOffs = _divideParts(fileSize, partSize);
  const numParts = partOffs.length;
  let multipartFinish = false;

  let uploadPartJob = function uploadPartJob(partNo) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!client.options.cancelFlag) {
          const pi = partOffs[partNo - 1];
          const data = {
            stream: _createStream(file, pi.start, pi.end),
            size: pi.end - pi.start
          };

          const result = await _uploadPart(client, name, uploadId, partNo, data);
          if (!client.options.cancelFlag && !multipartFinish) {
            checkpoint.doneParts.push({
              number: partNo,
              etag: result.res.headers.etag
            });

            if (options.progress) {
              await options.progress(doneParts.length / numParts, checkpoint, result.res);
            }

            resolve({
              number: partNo,
              etag: result.res.headers.etag
            });
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      } catch (err) {
        const tempErr = new Error();
        tempErr.name = err.name;
        tempErr.message = err.message;
        tempErr.stack = err.stack;
        tempErr.partNum = partNo;
        copy(err).to(tempErr);
        reject(tempErr);
      }
    });
  };

  const all = Array.from(new Array(numParts), (x, i) => i + 1);
  const done = internalDoneParts.map(p => p.number);
  const todo = all.filter(p => done.indexOf(p) < 0);
  const defaultParallel = 5;
  const parallel = options.parallel || defaultParallel;

  // upload in parallel
  const jobErr = await _parallel(client, todo, parallel, value => new Promise((resolve, reject) => {
    uploadPartJob(value).then((result) => {
      if (result) {
        internalDoneParts.push(result);
      }
      resolve();
    }).catch((err) => {
      reject(err);
    });
  }));
  multipartFinish = true;

  if (client.options.cancelFlag) {
    uploadPartJob = null;
    throw _makeCancelEvent();
  }

  if (jobErr && jobErr.length > 0) {
    jobErr[0].message = `Failed to upload some parts with error: ${jobErr[0].toString()} part_num: ${jobErr[0].partNum}`;
    throw jobErr[0];
  }
  return await completeMultipartUpload(client, name, uploadId, internalDoneParts, options);
}
