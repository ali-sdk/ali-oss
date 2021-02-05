import { RequestOptions } from '../../types/params';
import { Client } from '../../setConfig';
export declare function getBucketWebsite(this: Client, name: string, options?: RequestOptions): Promise<{
    index: any;
    supportSubDir: any;
    type: any;
    routingRules: any[];
    error: any;
    res: any;
}>;
