declare class Client {
    options: any;
    urllib: any;
    agent: any;
    httpsAgent: any;
    ctx: any;
    userAgent: any;
    _createStream: any;
    constructor(options: any, ctx: any);
    static use(...fn: any): typeof Client;
    setConfig(options: any, ctx: any): void;
}
export declare const initClient: (options: any, ctx: any) => Client;
export { Client };
