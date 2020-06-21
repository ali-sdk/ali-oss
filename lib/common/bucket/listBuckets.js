"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBuckets = void 0;
const isArray_1 = require("../utils/isArray");
const formatTag_1 = require("../utils/formatTag");
async function listBuckets(query = {}, options = {}) {
    // prefix, marker, max-keys
    const { subres = {} } = query, restParams = __rest(query, ["subres"]);
    const params = this._bucketRequestParams('GET', '', Object.assign(subres, options.subres), options);
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
                StorageClass: item.StorageClass,
                tag: formatTag_1.formatTag(item)
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
}
exports.listBuckets = listBuckets;
;
