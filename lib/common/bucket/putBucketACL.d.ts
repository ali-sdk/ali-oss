import { ACLType, RequestOptions } from '../../types/params';
import { PutBucketACLReturnType } from '../../types/bucket';
import { Client } from '../../setConfig';
export declare function putBucketACL(this: Client, name: string, acl: ACLType, options?: RequestOptions): Promise<PutBucketACLReturnType>;
