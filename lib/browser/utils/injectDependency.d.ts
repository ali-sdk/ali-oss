import { put } from '../object/put';
import { isCancel } from '../../common/client';
import { uploadPart } from '../multipart/uploadPart';
import { completeMultipartUpload } from '../../common/multipart/completeMultipartUpload';
import { OSS } from '../core';
declare const Dependencies: {
    multipartUpload: {
        put: typeof put;
    };
    resumeMultipart: {
        isCancel: typeof isCancel;
        uploadPart: typeof uploadPart;
        completeMultipartUpload: typeof completeMultipartUpload;
    };
};
export declare function injectDependency(ctx: OSS, name: keyof typeof Dependencies): void;
export {};
