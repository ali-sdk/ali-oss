import { RequestOptions } from '../../types/params';
/**
 * getBucketStat
 * @param {String} name - bucket name
 * @return {Object}
 */
export declare function getBucketStat(this: any, name: string, options?: RequestOptions): Promise<{
    res: any;
    stat: any;
}>;
