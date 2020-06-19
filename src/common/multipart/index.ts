import { completeMultipartUpload } from './completeMultipartUpload';
import { initMultipartUpload } from './initMultipartUpload';
import { listUploads } from './listUploads';
import { listParts } from './listParts';
import { abortMultipartUpload } from './abortMultipartUpload';
import { uploadPart } from './uploadPart';
import { handleUploadPart } from './handleUploadPart';
import { resumeMultipart } from './resumeMultipart';
import { multipartUploadCopy } from './multipartUploadCopy';
import { uploadPartCopy } from './uploadPartCopy';

export default {
  completeMultipartUpload,
  initMultipartUpload,
  listUploads,
  listParts,
  abortMultipartUpload,
  uploadPart,
  handleUploadPart,
  resumeMultipart,
  multipartUploadCopy,
  uploadPartCopy,
};

