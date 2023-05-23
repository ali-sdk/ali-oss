"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._stop = void 0;
function _stop() {
    this.options.cancelFlag = true;
    this.options.multipartRunning = false;
}
exports._stop = _stop;
