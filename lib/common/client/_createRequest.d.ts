import { Client } from '../../setConfig';
interface ReqParams {
    [propName: string]: any;
}
export declare function _createRequest(this: Client, params: any): {
    url: string;
    params: ReqParams;
};
export {};
