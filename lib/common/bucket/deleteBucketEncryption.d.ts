import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
/**
 * deleteBucketEncryption
 * @param {String} bucketName - bucket name
 */
export declare function deleteBucketEncryption(this: Client, bucketName: string, options?: RequestOptions): Promise<NormalSuccessResponseWithStatus>;
