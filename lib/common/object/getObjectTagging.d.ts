import { MultiVersionCommonOptions } from '../../types/params';
/**
 * getObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 * @return {Object}
 */
export declare function getObjectTagging(this: any, name: string, options?: MultiVersionCommonOptions): Promise<{
    status: number;
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
    tag: {};
}>;
