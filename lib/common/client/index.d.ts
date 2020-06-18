import { _createRequest } from './_createRequest';
import { _stop } from './_stop';
import { _objectRequestParams } from './_objectRequestParams';
import { _bucketRequestParams } from './_bucketRequestParams';
import { getBucket } from './getBucket';
import { setBucket } from './setBucket';
declare const _default: {
    _createRequest: typeof _createRequest;
    _stop: typeof _stop;
    _objectRequestParams: typeof _objectRequestParams;
    _bucketRequestParams: typeof _bucketRequestParams;
    getBucket: typeof getBucket;
    setBucket: typeof setBucket;
    useBucket: typeof setBucket;
};
export default _default;
