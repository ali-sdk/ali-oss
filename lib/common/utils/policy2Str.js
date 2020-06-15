"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policy2Str = void 0;
function policy2Str(policy) {
    let policyStr;
    if (policy) {
        if (typeof policy === 'string') {
            try {
                policyStr = JSON.stringify(JSON.parse(policy));
            }
            catch (err) {
                throw new Error(`Policy string is not a valid JSON: ${err.message}`);
            }
        }
        else {
            policyStr = JSON.stringify(policy);
        }
    }
    return policyStr;
}
exports.policy2Str = policy2Str;
