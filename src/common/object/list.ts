import { objectUrl } from '../utils/objectUrl';
import { ObjectListQueryParams, ObjectListReturnType } from '../../types/object';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';

export async function list(
  this: Client,
  query: ObjectListQueryParams = {},
  options: any = {}
): Promise<ObjectListReturnType> {
  // prefix, marker, max-keys, delimiter

  const params = _objectRequestParams.call(this, 'GET', '', options);
  params.query = query;
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
