const defaultPartSize = 1 * 1024 * 1024;

export function getPartSize(fileSize: number, partSize?: number) {
  const maxNumParts = 10 * 1000;
  const safeSize = Math.ceil(fileSize / maxNumParts);
  if (!partSize) partSize = defaultPartSize;
  if (partSize < safeSize) {
    partSize = safeSize;
    console.warn(`partSize has been set to ${partSize}, because the partSize you provided causes partNumber to be greater than 10,000`);
  }
  return partSize;
}
