import { ACLType, RequestOptions } from '../../types/params';
import { PutBucketACLReturnType } from '../../types/bucket';
export declare function putBucketACL(this: any, name: string, acl: ACLType, options?: RequestOptions): Promise<PutBucketACLReturnType>;
