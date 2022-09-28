"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetCancelFlag = void 0;
function resetCancelFlag() {
    this.options.multipartRunning = true;
    this.options.cancelFlag = false;
}
exports.resetCancelFlag = resetCancelFlag;
