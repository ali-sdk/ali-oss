import { Client } from '../setConfig';
import { IOptions } from '../types/params';
export { append, calculatePostSignature, copy, delete, deleteObject, deleteMulti, deleteObjectTagging, generateObjectUrl, get, getACL, getAsyncFetch, getBucketVersions, listObjectVersions, getObjectMeta, getObjectTagging, getObjectUrl, getSymlink, head, list, listV2, postAsyncFetch, putACL, putMeta, putObjectTagging, putSymlink, restore, signatureUrl, } from '../common/object';
export { processObjectSave } from '../common/image';
export { completeMultipartUpload, initMultipartUpload, listUploads, listParts, abortMultipartUpload, multipartUploadCopy, uploadPartCopy, } from '../common/multipart';
export { abortBucketWorm, completeBucketWorm, deleteBucket, deleteBucketCORS, deleteBucketEncryption, deleteBucketInventory, deleteBucketLifecycle, deleteBucketLogging, deleteBucketPolicy, deleteBucketReferer, deleteBucketTags, deleteBucketWebsite, extendBucketWorm, getBucketACL, getBucketCORS, getBucketEncryption, getBucketInfo, getBucketInventory, getBucketLifecycle, getBucketLocation, getBucketLogging, getBucketPolicy, getBucketReferer, getBucketRequestPayment, getBucketTags, getBucketVersioning, getBucketWebsite, getBucketWorm, initiateBucketWorm, listBucketInventory, listBuckets, putBucket, putBucketACL, putBucketCORS, putBucketEncryption, putBucketInventory, putBucketLifecycle, putBucketLogging, putBucketPolicy, putBucketReferer, putBucketRequestPayment, putBucketTags, putBucketVersioning, putBucketWebsite, } from '../common/bucket';
export { isCancel, resetCancelFlag, setBucket, useBucket, setSLDEnabled, signature, } from '../common/client';
export { putStream, put } from './object';
export { multipartUpload, uploadPart, cancel, } from './multipart';
export declare class OSS extends Client {
    static urllib: any;
    static version: string;
    constructor(props: IOptions, ctx?: any);
}
export * from '../types';
