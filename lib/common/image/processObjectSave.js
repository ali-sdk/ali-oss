/* eslint-disable no-use-before-define */
const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');
const querystring = require('querystring');
const { Base64: { encode: str2Base64 } } = require('js-base64');

const proto = exports;

proto.processObjectSave = async function processObjectSave(sourceObject, targetObject, process, targetBucket) {
  checkArgs(sourceObject, 'sourceObject');
  checkArgs(targetObject, 'targetObject');
  checkArgs(process, 'process');
  targetObject = this._objectName(targetObject);
  if (targetBucket) {
    _checkBucketName(targetBucket);
  }

  const params = this._objectRequestParams('POST', sourceObject, {
    subres: 'x-oss-process'
  });

  const bucketParam = targetBucket ? `,b_${str2Base64(targetBucket)}` : '';
  targetObject = str2Base64(targetObject);

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
