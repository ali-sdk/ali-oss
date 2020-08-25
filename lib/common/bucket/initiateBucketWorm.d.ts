import { RequestOptions } from '../../types/params';
export declare function initiateBucketWorm(this: any, name: string, days: string, options?: RequestOptions): Promise<{
    res: any;
    wormId: any;
    status: any;
}>;
