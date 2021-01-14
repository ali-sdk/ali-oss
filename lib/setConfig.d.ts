import { IOptions } from './types/params';
declare class Client {
    options: any;
    urllib: any;
    agent: any;
    httpsAgent: any;
    ctx: any;
    userAgent: any;
    _createStream: any;
    constructor(options: IOptions, ctx?: any);
    static use(...fn: any): typeof Client;
    setConfig(options: IOptions & {
        inited?: true;
    }, ctx: any): void;
}
export declare const initClient: (options: IOptions, ctx?: any) => Client;
export { Client };
