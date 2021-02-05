"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectDependency = void 0;
const put_1 = require("../object/put");
const client_1 = require("../../common/client");
const uploadPart_1 = require("../multipart/uploadPart");
const completeMultipartUpload_1 = require("../../common/multipart/completeMultipartUpload");
const Dependencies = {
    multipartUpload: {
        put: put_1.put,
    },
    resumeMultipart: {
        isCancel: client_1.isCancel,
        uploadPart: uploadPart_1.uploadPart,
        completeMultipartUpload: completeMultipartUpload_1.completeMultipartUpload
    }
};
function injectDependency(ctx, name) {
    const dependencies = Dependencies[name];
    if (!dependencies)
        return;
    Object.keys(dependencies).forEach(attibute => {
        if (ctx[attibute])
            return;
        const mayBeNestedMethod = dependencies[attibute];
        if (typeof mayBeNestedMethod === 'function') {
            ctx[attibute] = mayBeNestedMethod;
        }
    });
}
exports.injectDependency = injectDependency;
