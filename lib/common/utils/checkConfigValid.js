"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConfigValid = void 0;
const checkConfigMap = {
    endpoint: checkEndpoint,
    region: /^[a-zA-Z0-9\-_]+$/
};
function checkEndpoint(endpoint) {
    if (typeof endpoint === 'string') {
        return /^[a-zA-Z0-9._:/-]+$/.test(endpoint);
    }
    else if (endpoint.host) {
        return /^[a-zA-Z0-9._:/-]+$/.test(endpoint.host);
    }
    return false;
}
exports.checkConfigValid = (conf, key) => {
    if (checkConfigMap[key]) {
        let isConfigValid = true;
        if (checkConfigMap[key] instanceof Function) {
            isConfigValid = checkConfigMap[key](conf);
        }
        else {
            isConfigValid = checkConfigMap[key].test(conf);
        }
        if (!isConfigValid) {
            throw new Error(`The ${key} must be conform to the specifications`);
        }
    }
};
