import { NormalSuccessResponse, RuleStatusType, Tag } from './params';

interface LifecycleDate {
  /** expire after the days */
  days?: number | string;
  /** expire date, equivalent date. e.g: 2020-02-18T00:00:00.000Z */
  createdBeforeDate?: string;
}

interface LifecycleTransition extends LifecycleDate {
  storageClass: 'IA' | 'Archive';
}

interface LifecycleExpiration extends LifecycleDate {
  /** 是否自动移除过期删除标记 */
  expiredObjectDeleteMarker?: boolean;
}

interface LifecycleNoncurrentDays {
  /** the number of days within which the previous versions can be retained.  */
  noncurrentDays: string | number;
}
interface LifecycleNoncurrentVersionTransition extends LifecycleNoncurrentDays {
  storageClass: 'IA' | 'Archive';
}

export interface LifecycleRule extends LifecycleDate {
  /** rule id, if not set, OSS will auto create it with random string. */
  id?: string;
  /** the prefix of names of objects to which the rule applies.  */
  prefix: string;
  /** rule status */
  status: RuleStatusType;
  /** specifies the expiration attribute of the lifecycle rules for the object */
  expiration?: LifecycleExpiration;
  /** specifies the expiration attribute of the multipart upload tasks that are not complete. */
  abortMultipartUpload?: LifecycleDate;
  /** specifies the time when an object is converted to the IA or archive storage class during a valid life cycle. */
  transition?: LifecycleTransition;
  noncurrentVersionTransition?: LifecycleNoncurrentVersionTransition;
  noncurrentVersionExpiration?: LifecycleNoncurrentDays;
  /** specifies the object tag applicable to a rule. */
  tag?: Tag | Tag[]; // filter object
}

export interface GetBucketLifecycleReturnType extends NormalSuccessResponse {
  rules: LifecycleRule[] | null
}