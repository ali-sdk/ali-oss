"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.divideParts = void 0;
function divideParts(fileSize, partSize) {
    const numParts = Math.ceil(fileSize / partSize);
    const partOffs = [];
    for (let i = 0; i < numParts; i++) {
        const start = partSize * i;
        const end = Math.min(start + partSize, fileSize);
        partOffs.push({
            start,
            end
        });
    }
    return partOffs;
}
exports.divideParts = divideParts;
