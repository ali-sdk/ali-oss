"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSTSToken = void 0;
const formatObjKey_1 = require("./formatObjKey");
async function setSTSToken() {
    if (!this.options)
        this.options = {};
    let credentials = await this.options.refreshSTSToken();
    credentials = formatObjKey_1.formatObjKey(credentials, 'firstLowerCase');
    if (credentials.securityToken) {
        credentials.stsToken = credentials.securityToken;
    }
    checkCredentials(credentials);
    Object.assign(this.options, credentials);
}
exports.setSTSToken = setSTSToken;
function checkCredentials(obj) {
    const stsTokenKey = ['accessKeySecret', 'accessKeyId', 'stsToken'];
    const objKeys = Object.keys(obj);
    stsTokenKey.forEach(_ => {
        if (!objKeys.find(key => key === _)) {
            throw Error(`refreshSTSToken must return contains ${_}`);
        }
    });
}
