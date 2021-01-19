import { obj2xml } from '../utils/obj2xml';
import { checkBucketName } from '../utils/checkBucketName';
import { NormalSuccessResponseWithStatus, RequestOptions, Versioning } from '../../types/params';

/**
 * putBucketVersioning
 * @param {String} name - bucket name
 * @param {String} status
 * @param {Object} options
 */

export async function putBucketVersioning(this: any, name: string, status: Versioning, options: RequestOptions = {}): Promise<NormalSuccessResponseWithStatus> {
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
}
