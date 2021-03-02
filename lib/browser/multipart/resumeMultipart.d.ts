import { Checkpoint, MultipartUploadOptions } from '../../types/params';
import { OSS } from '../core';
export declare function resumeMultipart(this: OSS, checkpoint: Checkpoint, options?: MultipartUploadOptions): Promise<import("../core").ObjectCompleteMultipartUploadReturnType>;
