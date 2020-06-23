declare class Client {
    options: any;
    urllib: any;
    agent: any;
    httpsAgent: any;
    ctx: any;
    userAgent: any;
    constructor(options: any, ctx: any);
    use(...fn: any): this;
    setConfig(options: any, ctx: any): void;
}
export declare const initClient: (options: any, ctx: any) => Client;
export { Client };
