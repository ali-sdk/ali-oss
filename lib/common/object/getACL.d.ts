import { MultiVersionCommonOptions } from '../../types/params';
export declare function getACL(this: any, name: string, options?: MultiVersionCommonOptions): Promise<{
    acl: any;
    owner: {
        id: any;
        displayName: any;
    };
    res: any;
}>;
