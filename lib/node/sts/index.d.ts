declare class STS {
    options: any;
    urllib: any;
    agent: any;
    constructor(options?: any);
    assumeRole(role: any, policy: any, expiration: any, session: any, options: any): Promise<{
        res: any;
        credentials: any;
    }>;
    _requestError(result: any): Promise<any>;
    _getSignature(method: any, params: any, key: any): any;
    _escape(str: any): string;
}
export default STS;
