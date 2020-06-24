import { _bucketRequestParams } from './_bucketRequestParams';
import { _checkUserAgent } from './_checkUserAgent';
import { _createRequest } from './_createRequest';
import { _getReqUrl } from './_getReqUrl';
import { _getResource } from './_getResource';
import { _getUserAgent } from './_getUserAgent';
import { _objectRequestParams } from './_objectRequestParams';
import { _stop } from './_stop';
import { cancel } from './cancel';
import { getBucket } from './getBucket';
import { isCancel } from './isCancel';
import { request } from './request';
import { requestError } from './requestError';
import { resetCancelFlag } from './resetCancelFlag';
import { setBucket } from './setBucket';
import { setSLDEnabled } from './setSLDEnabled';
import { signature } from './signature';

export default {
  _bucketRequestParams,
  _checkUserAgent,
  _createRequest,
  _getReqUrl,
  _getResource,
  _getUserAgent,
  _objectRequestParams,
  _stop,
  cancel,
  getBucket,
  isCancel,
  request,
  requestError,
  resetCancelFlag,
  setBucket,
  useBucket: setBucket,
  setSLDEnabled,
  signature,
};