import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';

type Field =
  'Size | LastModifiedDate | ETag | StorageClass | IsMultipartUploaded | EncryptionStatus | ObjectAcl | TaggingCount | ObjectType | Crc64';

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
    encryption?:
      | { 'SSE-OSS': '' }
      | {
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

export async function putBucketInventory(this: any, bucketName: string, inventory: Inventory, options: any = {}) {
  const subres: any = Object.assign({ inventory: '', inventoryId: inventory.id }, options.subres);
  checkBucketName(bucketName);
  const { OSSBucketDestination, optionalFields, includedObjectVersions } = inventory;
  const destinationBucketPrefix = 'acs:oss:::';
  const rolePrefix = `acs:ram::${OSSBucketDestination.accountId}:role/`;
  const paramXMLObj: any = {
    InventoryConfiguration: {
      Id: inventory.id,
      IsEnabled: inventory.isEnabled,
      Filter: {
        Prefix: inventory.prefix || ''
      },
      Destination: {
        OSSBucketDestination: {
          Format: OSSBucketDestination.format,
          AccountId: OSSBucketDestination.accountId,
          RoleArn: `${rolePrefix}${OSSBucketDestination.rolename}`,
          Bucket: `${destinationBucketPrefix}${OSSBucketDestination.bucket}`,
          Prefix: OSSBucketDestination.prefix || '',
          Encryption: OSSBucketDestination.encryption || ''
        }
      },
      Schedule: {
        Frequency: inventory.frequency
      },
      IncludedObjectVersions: includedObjectVersions,
      OptionalFields: {
        Field: optionalFields?.field || []
      }
    }
  };
  const paramXML = obj2xml(paramXMLObj, {
    headers: true,
    firstUpperCase: true
  });

  const params = this._bucketRequestParams('PUT', bucketName, subres, options);
  params.successStatuses = [200];
  params.mime = 'xml';
  params.content = paramXML;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res
  };
}
