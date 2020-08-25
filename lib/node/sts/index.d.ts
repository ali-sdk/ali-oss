import { HttpMethod } from 'urllib';
declare class STS {
    options: any;
    urllib: any;
    agent: any;
    constructor(options?: any);
    assumeRole(role: string, policy: string | object, expiration: number, session: string, options: any): Promise<{
        res: any;
        credentials: any;
    }>;
    _requestError(result: any): Promise<any>;
    _getSignature(method: HttpMethod, params: object, key: string): any;
    _escape(str: string): string;
}
export default STS;
