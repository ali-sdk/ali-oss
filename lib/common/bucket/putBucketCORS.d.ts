import { RequestOptions, CORSRuleConfig } from '../../types/params';
export declare function putBucketCORS(this: any, name: string, rules?: CORSRuleConfig[], options?: RequestOptions): Promise<{
    res: any;
}>;
