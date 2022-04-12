"use strict";
/* eslint-disable max-len */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMUploadType = exports.ETaskStatus = void 0;
/** task status */
var ETaskStatus;
(function (ETaskStatus) {
    ETaskStatus[ETaskStatus["wait"] = 0] = "wait";
    ETaskStatus[ETaskStatus["suspend"] = 1] = "suspend";
    ETaskStatus[ETaskStatus["doing"] = 2] = "doing";
    ETaskStatus[ETaskStatus["fail"] = 3] = "fail";
    ETaskStatus[ETaskStatus["success"] = 4] = "success";
})(ETaskStatus = exports.ETaskStatus || (exports.ETaskStatus = {}));
/** multiple upload object type */
var EMUploadType;
(function (EMUploadType) {
    EMUploadType[EMUploadType["small"] = 0] = "small";
    EMUploadType[EMUploadType["big"] = 1] = "big";
})(EMUploadType = exports.EMUploadType || (exports.EMUploadType = {}));
