import { ACLType, MultiVersionCommonOptions, NormalSuccessResponse } from '../../types/params';
import { Client } from '../../setConfig';
export declare function putACL(this: Client, name: string, acl: ACLType, options?: MultiVersionCommonOptions): Promise<NormalSuccessResponse>;
