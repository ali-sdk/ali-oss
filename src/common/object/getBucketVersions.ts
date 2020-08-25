import { formatQuery } from '../utils/formatQuery';
import { isArray } from '../utils/isArray';
import { objectUrl } from '../utils/objectUrl';
import { getBucketVersionsQuery, MultiVersionCommonOptions } from '../../types/params';


// proto.getBucketVersions = getBucketVersions;
// proto.listObjectVersions = getBucketVersions;

export async function getBucketVersions(this: any, query: getBucketVersionsQuery = {}, options: MultiVersionCommonOptions = {}) {
  // prefix, key-marker, max-keys, delimiter, encoding-type, version-id-marker
  if (query.versionIdMarker && query.keyMarker === undefined) {
    throw new Error('A version-id marker cannot be specified without a key marker');
  }

  options.subres = Object.assign({ versions: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = this._objectRequestParams('GET', '', options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  params.query = formatQuery(query);

  const result = await this.request(params);
  let objects = result.data.Version || [];
  let deleteMarker = result.data.DeleteMarker || [];
  if (objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    objects = objects.map(obj => ({
      name: obj.Key,
      url: objectUrl(obj.Key, this.options),
      lastModified: obj.LastModified,
      isLatest: obj.IsLatest === 'true',
      versionId: obj.VersionId,
      etag: obj.ETag,
      type: obj.Type,
      size: Number(obj.Size),
      storageClass: obj.StorageClass,
      owner: {
        id: obj.Owner.ID,
        displayName: obj.Owner.DisplayName
      }
    }));
  }
  if (deleteMarker) {
    if (!isArray(deleteMarker)) {
      deleteMarker = [deleteMarker];
    }
    deleteMarker = deleteMarker.map(obj => ({
      name: obj.Key,
      lastModified: obj.LastModified,
      versionId: obj.VersionId,
      owner: {
        id: obj.Owner.ID,
        displayName: obj.Owner.DisplayName
      }
    }));
  }
  let prefixes = result.data.CommonPrefixes || null;
  if (prefixes) {
    if (!isArray(prefixes)) {
      prefixes = [prefixes];
    }
    prefixes = prefixes.map(item => item.Prefix);
  }
  return {
    res: result.res,
    objects,
    deleteMarker,
    prefixes,
    nextMarker: result.data.NextMarker || null,
    NextVersionIdMarker: result.data.NextVersionIdMarker || null,
    isTruncated: result.data.IsTruncated === 'true'
  };
}