declare class Client {
    options: any;
    urllib: any;
    agent: any;
    httpsAgent: any;
    ctx: any;
    userAgent: any;
    constructor(options: any, ctx: any);
    use(fn: Function): any;
    setConfig(options: any, ctx: any): void;
}
export declare const setConfig: (options: any, ctx: any) => Client;
export { Client };
