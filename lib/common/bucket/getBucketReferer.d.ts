import { RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function getBucketReferer(this: Client, name: string, options?: RequestOptions): Promise<{
    allowEmpty: boolean;
    referers: any;
    res: any;
}>;
