import { ObjectListV2QueryParams, ObjectListV2ReturnType } from '../../types/object';
import { Client } from '../../setConfig';
import { RequestOptions } from '../../types/params';
export declare function listV2(this: Client, query: ObjectListV2QueryParams, options?: RequestOptions): Promise<ObjectListV2ReturnType>;
