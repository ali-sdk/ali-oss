import { Checkpoint, MultipartUploadOptions } from '../../types/params';
import OSS from '..';
export declare function resumeMultipart(this: OSS, checkpoint: Checkpoint, options?: MultipartUploadOptions): Promise<import("../../types/object").ObjectCompleteMultipartUploadReturnType>;
