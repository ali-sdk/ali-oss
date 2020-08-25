import { ACLType, RequestOptions } from '../../types/params';
export declare function putBucketACL(this: any, name: string, acl: ACLType, options?: RequestOptions): Promise<{
    bucket: any;
    res: any;
}>;
