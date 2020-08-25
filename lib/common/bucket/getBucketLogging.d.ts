import { RequestOptions } from '../../types/params';
export declare function getBucketLogging(this: any, name: string, options?: RequestOptions): Promise<{
    enable: boolean;
    prefix: any;
    res: any;
}>;
