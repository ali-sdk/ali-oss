"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectUrl = void 0;
const getReqUrl_1 = require("./getReqUrl");
function objectUrl(name, options) {
    return getReqUrl_1.getReqUrl({ bucket: options.bucket, object: name }, options);
}
exports.objectUrl = objectUrl;
