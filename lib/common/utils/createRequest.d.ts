interface ReqParams {
    [propName: string]: any;
}
export declare function createRequest(this: any, params: any): {
    url: any;
    params: ReqParams;
};
export {};
