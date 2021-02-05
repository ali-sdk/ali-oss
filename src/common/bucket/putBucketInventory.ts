import { Client } from '../../setConfig';
import { PutBucketInventoryConfig } from '../../types/bucket';
import { NormalSuccessResponseWithStatus, RequestOptions } from '../../types/params';
import { _bucketRequestParams } from '../client/_bucketRequestParams';
import { checkBucketName } from '../utils/checkBucketName';
import { obj2xml } from '../utils/obj2xml';

/**
 * putBucketInventory
 */
export async function putBucketInventory(this: Client, bucketName: string, inventory: PutBucketInventoryConfig, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
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
        Field: optionalFields?.field || [],
      },
    },
  };
  const paramXML = obj2xml(paramXMLObj, {
    headers: true,
    firstUpperCase: true,
  });

  const params = _bucketRequestParams('PUT', bucketName, subres, options);
  params.successStatuses = [200];
  params.mime = 'xml';
  params.content = paramXML;
  const result = await this.request(params);
  return {
    status: result.status,
    res: result.res,
  };
}
