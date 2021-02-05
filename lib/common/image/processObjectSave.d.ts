import { Client } from '../../setConfig';
export declare function processObjectSave(this: Client, sourceObject: string, targetObject: string, process: string, targetBucket: string): Promise<{
    res: any;
    status: any;
}>;
