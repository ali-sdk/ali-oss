"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setConfig_1 = require("../setConfig");
const object_1 = __importDefault(require("../common/object"));
const multipart_1 = __importDefault(require("../common/multipart"));
const utils_1 = __importDefault(require("../common/utils"));
const image_1 = __importDefault(require("../common/image"));
const bucket_1 = __importDefault(require("../common/bucket"));
const client_1 = __importDefault(require("../common/client"));
const object_2 = __importDefault(require("./object"));
const client_2 = __importDefault(require("./client"));
const multipart_2 = __importDefault(require("./multipart"));
const utils_2 = __importDefault(require("./utils"));
const rtmp_1 = __importDefault(require("./rtmp"));
const sts_1 = __importDefault(require("./sts"));
const cluster_1 = __importDefault(require("./cluster"));
function initClientProto(protos) {
    Object.keys(protos).map(prop => {
        setConfig_1.Client.prototype[prop] = protos[prop];
    });
}
const OSS = setConfig_1.Client;
initClientProto(object_1.default);
initClientProto(multipart_1.default);
initClientProto(utils_1.default);
initClientProto(image_1.default);
initClientProto(bucket_1.default);
initClientProto(client_1.default);
initClientProto(object_2.default);
initClientProto(client_2.default);
initClientProto(multipart_2.default);
initClientProto(utils_2.default);
initClientProto(rtmp_1.default);
module.exports = OSS;
OSS.STS = sts_1.default;
OSS.ClusterClient = cluster_1.default(OSS);
