import { RequestOptions } from '../../types/params';
import { GetBucketVersioningReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
/**
 * getBucketVersioning
 * @param {String} bucketName - bucket name
 */
export declare function getBucketVersioning(this: Client, bucketName: string, options?: RequestOptions): Promise<GetBucketVersioningReturnType>;
