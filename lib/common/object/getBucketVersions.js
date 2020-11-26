/* eslint-disable no-use-before-define */
const proto = exports;
const { isObject } = require('../utils/isObject');
const { isArray } = require('../utils/isArray');


proto.getBucketVersions = getBucketVersions;
proto.listObjectVersions = getBucketVersions;

async function getBucketVersions(query = {}, options = {}) {
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
  const that = this;
  if (objects) {
    if (!Array.isArray(objects)) {
      objects = [objects];
    }
    objects = objects.map(obj => ({
      name: obj.Key,
      url: that._objectUrl(obj.Key),
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
    // attirbute of legacy error
    nextMarker: result.data.NextKeyMarker || null,
    // attirbute of legacy error
    NextVersionIdMarker: result.data.NextVersionIdMarker || null,
    nextKeyMarker: result.data.NextKeyMarker || null,
    nextVersionIdMarker: result.data.NextVersionIdMarker || null,
    isTruncated: result.data.IsTruncated === 'true'
  };
}


function camel2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function formatQuery(query = {}) {
  const obj = {};
  if (isObject(query)) {
    Object.keys(query).forEach((key) => {
      obj[camel2Line(key)] = query[key];
    });
  }

  return obj;
}

