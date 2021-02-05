"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
const commonObject = __importStar(require("../common/object"));
const commonMultipart = __importStar(require("../common/multipart"));
const commonImage = __importStar(require("../common/image"));
const commonBucket = __importStar(require("../common/bucket"));
const commonClient = __importStar(require("../common/client"));
const object = __importStar(require("./object"));
const multipart = __importStar(require("./multipart"));
function initClientProto(protos) {
    Object.keys(protos).forEach(prop => {
        core_1.OSS.prototype[prop] = protos[prop];
    });
}
initClientProto(commonObject);
initClientProto(commonMultipart);
initClientProto(commonImage);
initClientProto(commonBucket);
initClientProto(commonClient);
initClientProto(object);
initClientProto(multipart);
exports.default = core_1.OSS;
module.exports = core_1.OSS;
