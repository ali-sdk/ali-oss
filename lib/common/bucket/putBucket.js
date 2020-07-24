const proto = exports;
const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');
const { obj2xml } = require('../utils/obj2xml');

proto.putBucket = async function putBucket(name, options = {}) {
  _checkBucketName(name, true);
  const params = this._bucketRequestParams('PUT', name, '', options);

  const CreateBucketConfiguration = {};
  const paramlXMLObJ = {
    CreateBucketConfiguration
  };

  const storageClass = options.StorageClass || options.storageClass;
  const dataRedundancyType = options.DataRedundancyType || options.dataRedundancyType;
  if (storageClass || dataRedundancyType) {
    storageClass && (CreateBucketConfiguration.StorageClass = storageClass);
    dataRedundancyType && (CreateBucketConfiguration.DataRedundancyType = dataRedundancyType);
    params.mime = 'xml';
    params.content = obj2xml(paramlXMLObJ, { headers: true });
  }
  const { acl, headers = {} } = options;
  acl && (headers['x-oss-acl'] = acl);
  params.headers = headers;
  params.successStatuses = [200];
  const result = await this.request(params);
  return {
    bucket: (result.headers.location && result.headers.location.substring(1)) || null,
    res: result.res
  };
};
