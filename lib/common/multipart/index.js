"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const completeMultipartUpload_1 = require("./completeMultipartUpload");
const initMultipartUpload_1 = require("./initMultipartUpload");
const listUploads_1 = require("./listUploads");
const listParts_1 = require("./listParts");
const abortMultipartUpload_1 = require("./abortMultipartUpload");
const uploadPart_1 = require("./uploadPart");
const handleUploadPart_1 = require("./handleUploadPart");
const resumeMultipart_1 = require("./resumeMultipart");
const multipartUploadCopy_1 = require("./multipartUploadCopy");
const uploadPartCopy_1 = require("./uploadPartCopy");
exports.default = {
    completeMultipartUpload: completeMultipartUpload_1.completeMultipartUpload,
    initMultipartUpload: initMultipartUpload_1.initMultipartUpload,
    listUploads: listUploads_1.listUploads,
    listParts: listParts_1.listParts,
    abortMultipartUpload: abortMultipartUpload_1.abortMultipartUpload,
    uploadPart: uploadPart_1.uploadPart,
    handleUploadPart: handleUploadPart_1.handleUploadPart,
    resumeMultipart: resumeMultipart_1.resumeMultipart,
    multipartUploadCopy: multipartUploadCopy_1.multipartUploadCopy,
    uploadPartCopy: uploadPartCopy_1.uploadPartCopy,
};
