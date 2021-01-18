import { NormalSuccessResponse } from './params';

type StringPolicyCategory =
  'StringEquals' |
  'StringNotEquals' |
  'StringEqualsIgnoreCase' |
  'StringNotEqualsIgnoreCase' |
  'StringLike' |
  'StringNotLike';

type NumberPolicyCategory =
  'NumericEquals' |
  'NumericNotEquals' |
  'NumericLessThan' |
  'NumericLessThanEquals' |
  'NumericGreaterThan' |
  'NumericGreaterThanEquals';

type DateAndTimePolicyCategory =
  'DateEquals' |
  'DateNotEquals' |
  'DateLessThan' |
  'DateLessThanEquals' |
  'DateGreaterThan' |
  'DateGreaterThanEquals';

type BoolPolicyCategory = 'Bool';

type IPAndAddressPolicyCategory = 'IpAddress' | 'NotIpAddress';


type CommonPolicyConditionKeys = 'acs:CurrentTime' | 'acs:SecureTransport' | 'acs:SourceIp' | 'acs:MFAPresen';
type OSSPolicyConditionKeys = 'oss:Delimiter' | 'oss:Prefix';


type PolicyConditionOperators = StringPolicyCategory | NumberPolicyCategory | DateAndTimePolicyCategory | BoolPolicyCategory | IPAndAddressPolicyCategory;
type PolicyConditionKeys = CommonPolicyConditionKeys | OSSPolicyConditionKeys;

type PolicyActions =
  'oss:GetService' |
  'oss:PutBucket' |
  'oss:DeleteBucket' |
  'oss:GetBucket' |
  'oss:GetBucketInfo' |
  'oss:GetBucketLocation' |
  'oss:PutBucketAcl' |
  'oss:GetBucketAcl' |
  'oss:PutBucketLifecycle' |
  'oss:GetBucketLifecycle' |
  'oss:DeleteBucketLifecycle' |
  'oss:PutBucketVersioning' |
  'oss:GetBucketVersioning' |
  'oss:GetBucketVersions' |
  'oss:PutBucketReplication' |
  'oss:GetBucketReplication' |
  'oss:GetBucketReplicationLocation' |
  'oss:GetBucketReplicationProgress' |
  'oss:DeleteBucketReplication' |
  'oss:PutBucketPolicy' |
  'oss:GetBucketPolicy' |
  'oss:DeleteBucketPolicy' |
  'oss:PutBucketInventory' |
  'oss:GetBucketInventory' |
  'oss:ListBucketInventory' |
  'oss:DeleteBucketInventory' |
  'oss:InitiateBucketWorm' |
  'oss:AbortBucketWorm' |
  'oss:CompleteBucketWorm' |
  'oss:ExtendBucketWorm' |
  'oss:GetBucketWorm' |
  'oss:PutBucketLogging' |
  'oss:GetBucketLogging' |
  'oss:DeleteBucketLogging' |
  'oss:PutBucketWebsite' |
  'oss:GetBucketWebsite' |
  'oss:DeleteBucketWebsite' |
  'oss:PutBucketReferer' |
  'oss:GetBucketReferer' |
  'oss:PutBucketTags' |
  'oss:GetBucketTags' |
  'oss:DeleteBucketTags' |
  'oss:PutBucketEncryption' |
  'oss:GetBucketEncryption' |
  'oss:DeleteBucketEncryption' |
  'oss:PutBucketRequestPayment' |
  'oss:GetBucketRequestPayment' |
  'oss:PutObject' |
  'oss:CopyObject' |
  'oss:GetObject' |
  'oss:AppendObject' |
  'oss:DeleteObject' |
  'oss:DeleteMultipleObjects' |
  'oss:HeadObject' |
  'oss:GetObjectMeta' |
  'oss:PostObject' |
  'oss:PutObjectACL' |
  'oss:GetObjectACL' |
  'oss:Callback' |
  'oss:PutSymlink' |
  'oss:GetSymlink' |
  'oss:RestoreObject' |
  'oss:SelectObject' |
  'oss:PutObjectTagging' |
  'oss:GetObjectTagging' |
  'oss:DeleteObjectTagging' |
  'oss:InitiateMultipartUpload' |
  'oss:UploadPart' |
  'oss:UploadPartCopy' |
  'oss:CompleteMultipartUpload' |
  'oss:AbortMultipartUpload' |
  'oss:ListMultipartUploads' |
  'oss:ListParts' |
  'oss:PutBucketCors' |
  'oss:GetBucketCors' |
  'oss:DeleteBucketCors' |
  'oss:OptionObject' |
  'oss:PutLiveChannelStatus' |
  'oss:PutLiveChannel' |
  'oss:GetVodPlaylist' |
  'oss:PostVodPlaylist' |
  'oss:Get LiveChannelStat' |
  'oss:GetLiveChannelInfo' |
  'oss:GetLiveChannelHistory' |
  'oss:ListLiveChannel' |
  'oss:DeleteLiveChannel';

interface BucketPolicyElement {
  Effect: 'Allow' | 'Deny';
  Action: '*' | PolicyActions[];
  /** acs:oss:<region>:<account-id>:<bucket>/<object> */
  Resource: string[];
  Condition: {
    [op in keyof PolicyConditionOperators]: {
      [k in keyof PolicyConditionKeys]: op extends BoolPolicyCategory ? ['true' | 'false'] : string[]
    }
  };
  Pricipal?: string[];
}

export interface PutBucketPolicyConfig {
  Version: '1',
  Statement: BucketPolicyElement[];
}

export interface GetBucketPolicyReturnType extends NormalSuccessResponse {
  status: number;
  policy: null | {
    Version: '1';
    Statement: Array<Required<BucketPolicyElement>>
  }
}

