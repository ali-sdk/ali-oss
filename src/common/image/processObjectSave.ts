/* eslint-disable no-use-before-define */
import { checkBucketName as _checkBucketName } from '../utils/checkBucketName';
import { objectName } from '../utils/objectName';
import querystring from 'querystring';
import { Base64 } from 'js-base64/Base64';

export async function processObjectSave(this: any, sourceObject, targetObject, process, targetBucket) {
  checkArgs(sourceObject, 'sourceObject');
  checkArgs(targetObject, 'targetObject');
  checkArgs(process, 'process');
  targetObject = objectName(targetObject);
  if (targetBucket) {
    _checkBucketName(targetBucket);
  }

  const params = this._objectRequestParams('POST', sourceObject, {
    subres: 'x-oss-process'
  });

  const bucketParam = targetBucket ? `,b_${Base64.encode(targetBucket)}` : '';
  targetObject = Base64.encode(targetObject);

  const content = {
    'x-oss-process': `${process}|sys/saveas,o_${targetObject}${bucketParam}`
  };
  params.content = querystring.stringify(content);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.res.status
  };
};

function checkArgs(name, key) {
  if (!name) {
    throw new Error(`${key} is required`);
  }
  if (typeof name !== 'string') {
    throw new Error(`${key} must be String`);
  }
}
