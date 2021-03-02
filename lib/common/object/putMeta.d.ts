import { Client } from '../../setConfig';
import { RequestOptions } from '../../types/params';
export declare function putMeta(this: Client, name: string, meta?: {
    [props: string]: string;
}, options?: RequestOptions): Promise<import("../../types").ObjectCopyReturnType>;
