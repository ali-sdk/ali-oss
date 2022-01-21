declare type anonymousAccessParams = {
    bucketName?: string;
    object?: string;
    acl?: string;
};
export declare function anonymousAccessObject(this: any, target: anonymousAccessParams, opt: any): Promise<any>;
export {};
