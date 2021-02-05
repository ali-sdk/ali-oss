import { ObjectDeleteMultiNames, ObjectDeleteMultiOptions, ObjectDeleteMultiReturnType } from '../../types/object';
import { Client } from '../../setConfig';
export declare function deleteMulti(this: Client, names: ObjectDeleteMultiNames, options?: ObjectDeleteMultiOptions): Promise<ObjectDeleteMultiReturnType>;
