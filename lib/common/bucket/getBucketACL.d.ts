import { RequestOptions } from '../../types/params';
export declare function getBucketACL(this: any, name: string, options?: RequestOptions): Promise<{
    acl: any;
    owner: {
        id: any;
        displayName: any;
    };
    res: any;
}>;
