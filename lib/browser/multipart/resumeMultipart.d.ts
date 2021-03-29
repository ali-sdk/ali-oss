import { BrowserMultipartUploadOptions, Checkpoint } from '../../types/params';
import { OSS } from '../core';
export declare function resumeMultipart(this: OSS, checkpoint: Checkpoint, options?: BrowserMultipartUploadOptions): Promise<import("../core").ObjectCompleteMultipartUploadReturnType>;
