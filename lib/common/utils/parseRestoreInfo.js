'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.parseRestoreInfo = void 0;
exports.parseRestoreInfo = originalRestoreInfo => {
  let tempRestoreInfo;
  if (originalRestoreInfo) {
    tempRestoreInfo = {
      ongoingRequest: originalRestoreInfo.includes('true')
    };
    if (!tempRestoreInfo.ongoingRequest) {
      const matchArray = originalRestoreInfo.match(/expiry-date="(.*)"/);
      if (matchArray && matchArray[1]) {
        tempRestoreInfo.expiryDate = new Date(matchArray[1]);
      }
    }
  }
  return tempRestoreInfo;
};
