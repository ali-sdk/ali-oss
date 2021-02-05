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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setConfig_1 = require("../setConfig");
const commonObject = __importStar(require("../common/object"));
const commonMultipart = __importStar(require("../common/multipart"));
const commonImage = __importStar(require("../common/image"));
const commonBucket = __importStar(require("../common/bucket"));
const commonClient = __importStar(require("../common/client"));
const object_1 = __importDefault(require("./object"));
const client_1 = __importDefault(require("./client"));
const multipart_1 = __importDefault(require("./multipart"));
const rtmp_1 = __importDefault(require("./rtmp"));
const sts_1 = __importDefault(require("./sts"));
const cluster_1 = __importDefault(require("./cluster"));
function initClientProto(protos) {
    Object.keys(protos).forEach(prop => {
        OSS.prototype[prop] = protos[prop];
    });
}
class OSS extends setConfig_1.Client {
    constructor() {
        super(...arguments);
        this.multipartUploadStreams = [];
        // @ts-ignore
        this.sendToWormhole = client_1.default.sendToWormhole;
    }
}
OSS.STS = sts_1.default;
OSS.ClusterClient = cluster_1.default(OSS);
initClientProto(commonObject);
initClientProto(commonMultipart);
initClientProto(commonImage);
initClientProto(commonBucket);
initClientProto(commonClient);
initClientProto(object_1.default);
initClientProto(client_1.default);
initClientProto(multipart_1.default);
initClientProto(rtmp_1.default);
exports.default = OSS;
module.exports = OSS;
