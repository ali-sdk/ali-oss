"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multipartUpload_1 = require("./multipartUpload");
const uploadPart_1 = require("./uploadPart");
const cancel_1 = require("./cancel");
exports.default = {
    multipartUpload: multipartUpload_1.multipartUpload,
    uploadPart: uploadPart_1.uploadPart,
    cancel: cancel_1.cancel,
};
