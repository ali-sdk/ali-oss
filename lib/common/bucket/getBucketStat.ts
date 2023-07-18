import { checkBucketName } from '../utils/checkBucketName';

interface bucketStatRes {
  Storage: string;
  ObjectCount: string;
  MultipartUploadCount: string;
  LiveChannelCount: string;
  LastModifiedTime: string;
  StandardStorage: string;
  StandardObjectCount: string;
  InfrequentAccessStorage: string;
  InfrequentAccessRealStorage: string;
  InfrequentAccessObjectCount: string;
  ArchiveStorage: string;
  ArchiveRealStorage: string;
  ArchiveObjectCount: string;
  ColdArchiveStorage: string;
  ColdArchiveRealStorage: string;
  ColdArchiveObjectCount: string;
}

export async function getBucketStat(this: any, name: string, options: {}): Promise<{ res: any; stat: bucketStatRes }> {
  name = name || this.options.bucket;
  checkBucketName(name);
  const params = this._bucketRequestParams('GET', name, 'stat', options);
  params.successStatuses = [200];
  params.xmlResponse = true;
  const result = await this.request(params);

  return {
    res: result.res,
    stat: result.data
  };
}
