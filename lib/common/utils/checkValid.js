"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValidRegion = exports.checkValidEndpoint = exports.checkValid = void 0;
function checkValid(_value, _rules) {
    _rules.forEach((rule) => {
        if (rule.validator) {
            rule.validator(_value);
        }
        else if (rule.pattern && !rule.pattern.test(_value)) {
            throw new Error(rule.msg);
        }
    });
}
exports.checkValid = checkValid;
function checkValidEndpoint(value) {
    return checkValid(value, [{
            validator: function checkEndpoint(endpoint) {
                if (typeof endpoint === 'string') {
                    return /^[a-zA-Z0-9._:/-]+$/.test(endpoint);
                }
                else if (endpoint.host) {
                    return /^[a-zA-Z0-9._:/-]+$/.test(endpoint.host);
                }
                return false;
            }
        }]);
}
exports.checkValidEndpoint = checkValidEndpoint;
function checkValidRegion(value) {
    return checkValid(value, [{
            pattern: /^[a-zA-Z0-9\-_]+$/
        }]);
}
exports.checkValidRegion = checkValidRegion;
