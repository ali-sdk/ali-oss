import { RequestOptions } from '../../types/params';
import { GetBucketVersioningReturnType } from '../../types/bucket';
/**
 * getBucketVersioning
 * @param {String} bucketName - bucket name
 */
export declare function getBucketVersioning(this: any, bucketName: string, options?: RequestOptions): Promise<GetBucketVersioningReturnType>;
