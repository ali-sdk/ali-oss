import { completeMultipartUpload } from './completeMultipartUpload';
import { initMultipartUpload } from './initMultipartUpload';
import { listUploads } from './listUploads';
import { listParts } from './listParts';
import { abortMultipartUpload } from './abortMultipartUpload';
import { uploadPart } from './uploadPart';
import { handleUploadPart } from './handleUploadPart';
import { resumeMultipart } from './resumeMultipart';
declare const _default: {
    completeMultipartUpload: typeof completeMultipartUpload;
    initMultipartUpload: typeof initMultipartUpload;
    listUploads: typeof listUploads;
    listParts: typeof listParts;
    abortMultipartUpload: typeof abortMultipartUpload;
    uploadPart: typeof uploadPart;
    handleUploadPart: typeof handleUploadPart;
    resumeMultipart: typeof resumeMultipart;
};
export default _default;
