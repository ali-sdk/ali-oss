"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkObjectTag = void 0;
const { checkValid } = require('./checkValid');
const { isObject } = require('./isObject');
const commonRules = [
    {
        validator: (value) => {
            if (typeof value !== 'string') {
                throw new Error('the key and value of the tag must be String');
            }
        }
    },
    {
        pattern: /^[a-zA-Z0-9 +-=._:/]+$/,
        msg: 'tag can contain letters, numbers, spaces, and the following symbols: plus sign (+), hyphen (-), equal sign (=), period (.), underscore (_), colon (:), and forward slash (/)'
    }
];
const rules = {
    key: [
        ...commonRules,
        {
            pattern: /^.{1,128}$/,
            msg: 'tag key can be a maximum of 128 bytes in length'
        }
    ],
    value: [
        ...commonRules,
        {
            pattern: /^.{0,256}$/,
            msg: 'tag value can be a maximum of 256 bytes in length'
        }
    ]
};
function checkObjectTag(tag) {
    if (!isObject(tag)) {
        throw new Error('tag must be Object');
    }
    const entries = Object.entries(tag);
    if (entries.length > 10) {
        throw new Error('maximum of 10 tags for a object');
    }
    const rulesIndexKey = ['key', 'value'];
    entries.forEach((keyValue) => {
        keyValue.forEach((item, index) => {
            checkValid(item, rules[rulesIndexKey[index]]);
        });
    });
}
exports.checkObjectTag = checkObjectTag;
