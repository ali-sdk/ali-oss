/// <reference types="node" />
import { Subres } from '../../types/params';
export declare function _bucketRequestParams(method: any, bucket: any, subres: any, options: any): {
    method: string;
    bucket: string;
    subres: Subres;
    timeout: number | string;
    ctx: object;
    successStatuses?: number[];
    xmlResponse?: boolean;
    mime?: string;
    content?: Buffer | string;
    headers?: object;
};
