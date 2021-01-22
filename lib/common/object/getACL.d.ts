import { ACLType, MultiVersionCommonOptions } from '../../types/params';
export declare function getACL(this: any, name: string, options?: MultiVersionCommonOptions): Promise<{
    acl: ACLType;
    owner: {
        id: string;
        displayName: string;
    };
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
}>;
