import { ObjectCopyOptions, ObjectCopyReturnType } from '../../types/object';
import { Client } from '../../setConfig';
export declare function copy(this: Client, name: string, sourceName: string, bucketName?: string | ObjectCopyOptions, options?: ObjectCopyOptions): Promise<ObjectCopyReturnType>;
