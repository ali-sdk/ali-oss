declare type Field = 'Size | LastModifiedDate | ETag | StorageClass | IsMultipartUploaded | EncryptionStatus';
interface Inventory {
    id: string;
    isEnabled: true | false;
    prefix?: string;
    OSSBucketDestination: {
        format: 'CSV';
        accountId: string;
        rolename: string;
        bucket: string;
        prefix?: string;
        encryption?: {
            'SSE-OSS': '';
        } | {
            'SSE-KMS': {
                keyId: string;
            };
        };
    };
    frequency: 'Daily' | 'Weekly';
    includedObjectVersions: 'Current' | 'All';
    optionalFields?: {
        field?: Field[];
    };
}
/**
 * putBucketInventory
 * @param {String} bucketName - bucket name
 * @param {Inventory} inventory
 * @param {Object} options
 */
export declare function putBucketInventory(this: any, bucketName: string, inventory: Inventory, options?: any): Promise<{
    status: any;
    res: any;
}>;
export {};
