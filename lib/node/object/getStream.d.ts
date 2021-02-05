import OSS from '..';
import { ObjectGetOptions, ObjectGetStreamReturnType } from '../../types/object';
export declare function getStream(this: OSS, name: string, options?: ObjectGetOptions): Promise<ObjectGetStreamReturnType>;
