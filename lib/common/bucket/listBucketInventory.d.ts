/**
 * listBucketInventory
 * @param {String} bucketName - bucket name
 * @param {String} inventoryId
 * @param {Object} options
 */
export declare function listBucketInventory(this: any, bucketName: string, options?: any): Promise<{
    isTruncated: boolean;
    nextContinuationToken: any;
    inventoryList: any;
    status: any;
    res: any;
}>;
