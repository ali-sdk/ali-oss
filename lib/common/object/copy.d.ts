import { ObjectCopyOptions, ObjectCopyReturnType } from '../../types/object';
export declare function copy(this: any, name: string, sourceName: string, bucketName?: string | ObjectCopyOptions, options?: ObjectCopyOptions): Promise<ObjectCopyReturnType>;
