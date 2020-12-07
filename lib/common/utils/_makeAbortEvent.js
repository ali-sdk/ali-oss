"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._makeAbortEvent = void 0;
function _makeAbortEvent() {
    const abortEvent = {
        status: 0,
        name: 'abort',
        message: 'upload task has been abort'
    };
    return abortEvent;
}
exports._makeAbortEvent = _makeAbortEvent;
