const { checkBucketName } = require('../utils/checkBucketName');
const { obj2xml } = require('../utils/obj2xml');

/**
 * putBucketVersioning
 * @param {String} name - bucket name
 * @param {String} status
 * @param {Object} options
 */

export async function putBucketVersioning(this: any, name: string, status, options: any = {}) {
  checkBucketName(name);
  if (!['Enabled', 'Suspended'].includes(status)) {
    throw new Error('status must be Enabled or Suspended');
  }
  const params = this._bucketRequestParams('PUT', name, 'versioning', options);

  const paramXMLObj = {
    VersioningConfiguration: {
      Status: status
    }
  };

  params.mime = 'xml';
  params.content = obj2xml(paramXMLObj, {
    headers: true
  });

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
};
