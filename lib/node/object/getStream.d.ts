import { GetObjectOptions } from '../../types/params';
export declare function getStream(this: any, name: string, options?: GetObjectOptions): Promise<{
    stream: any;
    res: {
        status: any;
        headers: any;
    };
}>;
