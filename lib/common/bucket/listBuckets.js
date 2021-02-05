"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBuckets = void 0;
const isArray_1 = require("../utils/isArray");
const formatTag_1 = require("../utils/formatTag");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
async function listBuckets(query = {}, options = {}) {
    // prefix, marker, max-keys
    const { subres = {} } = query;
    const restParams = {};
    for (const key in query) {
        if (key !== 'subres') {
            restParams[key] = query[key];
        }
    }
    const params = _bucketRequestParams_1._bucketRequestParams('GET', '', Object.assign(subres, options.subres), options);
    params.xmlResponse = true;
    params.query = restParams || {};
    const result = await this.request(params);
    if (result.status === 200) {
        const { data } = result;
        let buckets = data.Buckets || null;
        if (buckets) {
            if (buckets.Bucket) {
                buckets = buckets.Bucket;
            }
            if (!isArray_1.isArray(buckets)) {
                buckets = [buckets];
            }
            buckets = buckets.map(item => ({
                name: item.Name,
                region: item.Location,
                creationDate: item.CreationDate,
                storageClass: item.StorageClass,
                StorageClass: item.StorageClass,
                tag: formatTag_1.formatTag(item),
            }));
        }
        return {
            buckets,
            owner: {
                id: data.Owner.ID,
                displayName: data.Owner.DisplayName,
            },
            isTruncated: data.IsTruncated === 'true',
            nextMarker: data.NextMarker || null,
            res: result.res,
        };
    }
    throw await this.requestError(result);
}
exports.listBuckets = listBuckets;
