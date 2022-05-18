"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePercentage = void 0;
exports.calculatePercentage = (fileSize, partList) => {
    const result = { percentage: 0, loaded: 0, total: fileSize };
    Object.keys(partList).forEach(i => {
        result.loaded += partList[i].loaded;
    });
    result.percentage = (result.loaded / fileSize) * 100;
    return result;
};
