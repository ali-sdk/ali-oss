"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRegion = void 0;
const checkValid_1 = require("../utils/checkValid");
const initOptions_1 = require("./initOptions");
function setRegion(region) {
    checkValid_1.checkValidRegion(region);
    this.options.region = region;
    this.options.endpoint = initOptions_1.getActualEndpointByRegion(region, this.options.internal, this.options.secure);
    return this;
}
exports.setRegion = setRegion;
