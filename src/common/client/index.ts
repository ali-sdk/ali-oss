import { _createRequest } from './_createRequest';
import { _stop } from './_stop';
import { _objectRequestParams } from './_objectRequestParams';
import { _bucketRequestParams } from './_bucketRequestParams';
import { getBucket } from './getBucket';
import { setBucket } from './setBucket';

export default {
  _createRequest,
  _stop,
  _objectRequestParams,
  _bucketRequestParams,
  getBucket,
  setBucket,
  useBucket: setBucket,
};
