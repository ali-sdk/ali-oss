import { dataFix } from '../utils/dataFix';
import { isObject } from '../utils/isObject';
import { isArray } from '../utils/isArray';
import { formatObjKey } from '../utils/formatObjKey';

export function formatInventoryConfig(inventoryConfig, toArray = false) {
  if (toArray && isObject(inventoryConfig)) inventoryConfig = [inventoryConfig];

  if (isArray(inventoryConfig)) {
    inventoryConfig = inventoryConfig.map(formatFn);
  } else {
    inventoryConfig = formatFn(inventoryConfig);
  }
  return inventoryConfig;
}

function formatFn(_) {
  dataFix(_, { bool: ['IsEnabled'] }, conf => {
    // prefix
    conf.prefix = conf.Filter.Prefix;
    delete conf.Filter;
    // OSSBucketDestination
    conf.OSSBucketDestination = conf.Destination.OSSBucketDestination;
    // OSSBucketDestination.rolename
    conf.OSSBucketDestination.rolename = conf.OSSBucketDestination.RoleArn.replace(/.*\//, '');
    delete conf.OSSBucketDestination.RoleArn;
    // OSSBucketDestination.bucket
    conf.OSSBucketDestination.bucket = conf.OSSBucketDestination.Bucket.replace(/.*:::/, '');
    delete conf.OSSBucketDestination.Bucket;
    delete conf.Destination;
    // frequency
    conf.frequency = conf.Schedule.Frequency;
    delete conf.Schedule.Frequency;
    // optionalFields
    if (conf?.OptionalFields?.Field && !isArray(conf.OptionalFields?.Field))
      conf.OptionalFields.Field = [conf.OptionalFields.Field];
  });
  // firstLowerCase
  _ = formatObjKey(_, 'firstLowerCase', { exclude: ['OSSBucketDestination', 'SSE-OSS', 'SSE-KMS'] });
  return _;
}
