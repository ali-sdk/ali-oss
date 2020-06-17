"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBucketVersions = void 0;
const formatQuery_1 = require("../utils/formatQuery");
const isArray_1 = require("../utils/isArray");
const objectRequestParams_1 = require("../utils/objectRequestParams");
const objectUrl_1 = require("../utils/objectUrl");
// proto.getBucketVersions = getBucketVersions;
// proto.listObjectVersions = getBucketVersions;
async function getBucketVersions(query = {}, options = {}) {
    // prefix, key-marker, max-keys, delimiter, encoding-type, version-id-marker
    if (query.versionIdMarker && query.keyMarker === undefined) {
        throw new Error('A version-id marker cannot be specified without a key marker');
    }
    options.subres = Object.assign({ versions: '' }, options.subres);
    if (options.versionId) {
        options.subres.versionId = options.versionId;
    }
    const params = objectRequestParams_1.objectRequestParams('GET', '', this.options.bucket, options);
    params.xmlResponse = true;
    params.successStatuses = [200];
    params.query = formatQuery_1.formatQuery(query);
    const result = await this.request(params);
    let objects = result.data.Version || [];
    let deleteMarker = result.data.DeleteMarker || [];
    if (objects) {
        if (!Array.isArray(objects)) {
            objects = [objects];
        }
        objects = objects.map(obj => ({
            name: obj.Key,
            url: objectUrl_1.objectUrl(obj.Key, this.options),
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
        if (!isArray_1.isArray(deleteMarker)) {
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
        if (!isArray_1.isArray(prefixes)) {
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
exports.getBucketVersions = getBucketVersions;
