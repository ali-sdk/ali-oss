import { RequestOptions } from '../../types/params';
/**
 * putBucketVersioning
 * @param {String} name - bucket name
 * @param {String} status
 * @param {Object} options
 */
export declare function putBucketVersioning(this: any, name: string, status: 'Enabled' | 'Suspended', options?: RequestOptions): Promise<{
    res: any;
    status: any;
}>;
