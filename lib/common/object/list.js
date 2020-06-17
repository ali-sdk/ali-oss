"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const objectUrl_1 = require("../utils/objectUrl");
const objectRequestParams_1 = require("../utils/objectRequestParams");
async function list(query, options) {
    // prefix, marker, max-keys, delimiter
    const params = objectRequestParams_1.objectRequestParams('GET', '', this.options.bucket, options);
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
            url: objectUrl_1.objectUrl(obj.Key, this.options),
            lastModified: obj.LastModified,
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
        isTruncated: result.data.IsTruncated === 'true'
    };
}
exports.list = list;
;
