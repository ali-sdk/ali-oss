"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValid = void 0;
function checkValid(_value, _rules) {
    _rules.forEach(rule => {
        if (rule.validator) {
            rule.validator(_value);
        }
        else if (rule.pattern && !rule.pattern.test(_value)) {
            throw new Error(rule.msg);
        }
    });
}
exports.checkValid = checkValid;
