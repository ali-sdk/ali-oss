export function divideParts(fileSize: number, partSize: number) {
  const numParts = Math.ceil(fileSize / partSize);

  const partOffs: Array<{start: any, end: any}> = [];
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
