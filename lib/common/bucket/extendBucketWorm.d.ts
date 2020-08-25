import { RequestOptions } from '../../types/params';
export declare function extendBucketWorm(this: any, name: string, wormId: string, days: string, options?: RequestOptions): Promise<{
    res: any;
    status: any;
}>;
