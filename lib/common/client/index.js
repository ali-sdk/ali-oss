"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _bucketRequestParams_1 = require("./_bucketRequestParams");
const _checkUserAgent_1 = require("./_checkUserAgent");
const _createRequest_1 = require("./_createRequest");
const _getReqUrl_1 = require("./_getReqUrl");
const _getResource_1 = require("./_getResource");
const _getUserAgent_1 = require("./_getUserAgent");
const _objectRequestParams_1 = require("./_objectRequestParams");
const _stop_1 = require("./_stop");
const cancel_1 = require("./cancel");
const getBucket_1 = require("./getBucket");
const isCancel_1 = require("./isCancel");
const request_1 = require("./request");
const requestError_1 = require("./requestError");
const resetCancelFlag_1 = require("./resetCancelFlag");
const setBucket_1 = require("./setBucket");
const setSLDEnabled_1 = require("./setSLDEnabled");
const signature_1 = require("./signature");
exports.default = {
    _bucketRequestParams: _bucketRequestParams_1._bucketRequestParams,
    _checkUserAgent: _checkUserAgent_1._checkUserAgent,
    _createRequest: _createRequest_1._createRequest,
    _getReqUrl: _getReqUrl_1._getReqUrl,
    _getResource: _getResource_1._getResource,
    _getUserAgent: _getUserAgent_1._getUserAgent,
    _objectRequestParams: _objectRequestParams_1._objectRequestParams,
    _stop: _stop_1._stop,
    cancel: cancel_1.cancel,
    getBucket: getBucket_1.getBucket,
    isCancel: isCancel_1.isCancel,
    request: request_1.request,
    requestError: requestError_1.requestError,
    resetCancelFlag: resetCancelFlag_1.resetCancelFlag,
    setBucket: setBucket_1.setBucket,
    useBucket: setBucket_1.setBucket,
    setSLDEnabled: setSLDEnabled_1.setSLDEnabled,
    signature: signature_1.signature,
};
