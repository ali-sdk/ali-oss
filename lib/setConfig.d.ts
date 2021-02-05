import { request } from './common/client/request';
import { requestError } from './common/client/requestError';
import { IOptions } from './types/params';
import * as commonObject from './common/object';
import * as commonMultipart from './common/multipart';
import * as commonImage from './common/image';
import * as commonBucket from './common/bucket';
import * as commonClient from './common/client';
declare class Client {
    protected _setOptions: number;
    protected sendToWormhole?: Function;
    options: any;
    urllib: any;
    agent: any;
    httpsAgent: any;
    ctx: any;
    userAgent: any;
    request: typeof request;
    requestError: typeof requestError;
    constructor(options: IOptions, ctx?: any);
    static use(...fn: any): typeof Client;
    static register(name: string, fn: Function): typeof Client;
    setConfig(options: IOptions & {
        inited?: true;
    }, ctx: any): void;
}
declare type ICommonObject = typeof commonObject;
declare type ICommonMultipart = typeof commonMultipart;
declare type ICommonImage = typeof commonImage;
declare type ICommonBucket = typeof commonBucket;
declare type ICommonClient = typeof commonClient;
interface Client extends ICommonBucket, ICommonMultipart, ICommonObject, ICommonImage, ICommonClient {
}
export declare const initClient: (options: IOptions, ctx?: any) => Client;
export { Client };
