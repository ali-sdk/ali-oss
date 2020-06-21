import { isArray } from "../utils/isArray";
import { formatTag } from "../utils/formatTag";

export async function listBuckets(this: any, query: any = {}, options: any = {}) {
  // prefix, marker, max-keys

  const { subres = {}, ...restParams } = query;
  const params: any = this._bucketRequestParams(
    'GET',
    '',
    Object.assign(subres, options.subres),
    options
  );
  params.xmlResponse = true
  params.query = restParams || {}

  const result = await this.request(params);

  if (result.status === 200) {
    const { data } = result;
    let buckets = data.Buckets || null;
    if (buckets) {
      if (buckets.Bucket) {
        buckets = buckets.Bucket;
      }
      if (!isArray(buckets)) {
        buckets = [buckets];
      }
      buckets = buckets.map(item => ({
        name: item.Name,
        region: item.Location,
        creationDate: item.CreationDate,
        StorageClass: item.StorageClass,
        tag: formatTag(item)
      }));
    }
    return {
      buckets,
      owner: {
        id: data.Owner.ID,
        displayName: data.Owner.DisplayName
      },
      isTruncated: data.IsTruncated === 'true',
      nextMarker: data.NextMarker || null,
      res: result.res
    };
  }

  throw await this.requestError(result);
};