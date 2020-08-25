import { RequestOptions } from '../../types/params';
export declare function getBucketReferer(this: any, name: string, options?: RequestOptions): Promise<{
    allowEmpty: boolean;
    referers: any;
    res: any;
}>;
