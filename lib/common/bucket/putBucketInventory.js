"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketInventory = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
/**
 * putBucketInventory
 * @param {String} bucketName - bucket name
 * @param {Inventory} inventory
 * @param {Object} options
 */
async function putBucketInventory(bucketName, inventory, options = {}) {
    const subres = Object.assign({ inventory: '', inventoryId: inventory.id }, options.subres);
    checkBucketName_1.checkBucketName(bucketName);
    const { OSSBucketDestination, optionalFields, includedObjectVersions } = inventory;
    const destinationBucketPrefix = 'acs:oss:::';
    const rolePrefix = `acs:ram::${OSSBucketDestination.accountId}:role/`;
    const paramXMLObj = {
        InventoryConfiguration: {
            Id: inventory.id,
            IsEnabled: inventory.isEnabled,
            Filter: {
                Prefix: inventory.prefix || '',
            },
            Destination: {
                OSSBucketDestination: {
                    Format: OSSBucketDestination.format,
                    AccountId: OSSBucketDestination.accountId,
                    RoleArn: `${rolePrefix}${OSSBucketDestination.rolename}`,
                    Bucket: `${destinationBucketPrefix}${OSSBucketDestination.bucket}`,
                    Prefix: OSSBucketDestination.prefix || '',
                    Encryption: OSSBucketDestination.encryption || '',
                },
            },
            Schedule: {
                Frequency: inventory.frequency,
            },
            IncludedObjectVersions: includedObjectVersions,
            OptionalFields: {
                Field: (optionalFields === null || optionalFields === void 0 ? void 0 : optionalFields.field) || [],
            },
        },
    };
    const paramXML = obj2xml_1.obj2xml(paramXMLObj, {
        headers: true,
        firstUpperCase: true,
    });
    const params = this._bucketRequestParams('PUT', bucketName, subres, options);
    params.successStatuses = [200];
    params.mime = 'xml';
    params.content = paramXML;
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res,
    };
}
exports.putBucketInventory = putBucketInventory;
