import { objectUrl } from '../utils/objectUrl';
import { listV2Query } from '../../types/params';

export async function listV2(this: any, query: listV2Query, options: { subres?: any } = {}) {
  const continuation_token = query['continuation-token'];
  delete query['continuation-token'];
  if (continuation_token) {
    options.subres = Object.assign(
      {
        'continuation-token': continuation_token
      },
      options.subres
    );
  }
  const params = this._objectRequestParams('GET', '', options);
  params.query = Object.assign({ 'list-type': 2 }, query);
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);
  let objects = result.data.Contents;
  if (objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    objects = objects.map(obj => ({
      name: obj.Key,
      url: objectUrl(obj.Key, this.options),
      lastModified: obj.LastModified,
      etag: obj.ETag,
      type: obj.Type,
      size: Number(obj.Size),
      storageClass: obj.StorageClass,
      owner: obj.Owner
        ? {
          id: obj.Owner.ID,
          displayName: obj.Owner.DisplayName
        }
        : null
    }));
  }
  let prefixes = result.data.CommonPrefixes || null;
  if (prefixes) {
    if (!Array.isArray(prefixes)) {
      prefixes = [prefixes];
    }
    prefixes = prefixes.map(item => item.Prefix);
  }
  return {
    res: result.res,
    objects,
    prefixes,
    isTruncated: result.data.IsTruncated === 'true',
    keyCount: +result.data.KeyCount,
    continuationToken: result.data.ContinuationToken || null,
    nextContinuationToken: result.data.NextContinuationToken || null
  };
}
