import { RequestOptions } from '../../types/params';
/**
 * getBucketVersioning
 * @param {String} bucketName - bucket name
 */
export declare function getBucketVersioning(this: any, bucketName: string, options?: RequestOptions): Promise<{
    status: any;
    versionStatus: any;
    res: any;
}>;
