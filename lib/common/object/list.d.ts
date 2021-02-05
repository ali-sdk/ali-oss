import { ObjectListQueryParams, ObjectListReturnType } from '../../types/object';
import { Client } from '../../setConfig';
export declare function list(this: Client, query?: ObjectListQueryParams, options?: any): Promise<ObjectListReturnType>;
