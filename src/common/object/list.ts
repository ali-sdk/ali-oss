import { objectUrl } from '../utils/objectUrl';
import { listQuery } from '../../types/params';

export async function list(
  this: any,
  query: listQuery = {},
  options: any = {}
) {
  // prefix, marker, max-keys, delimiter

  const params = this._objectRequestParams('GET', '', options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);
  let objects = result.data.Contents || [];
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
      owner: {
        id: obj.Owner.ID,
        displayName: obj.Owner.DisplayName,
      },
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
    nextMarker: result.data.NextMarker || null,
    isTruncated: result.data.IsTruncated === 'true',
  };
}
