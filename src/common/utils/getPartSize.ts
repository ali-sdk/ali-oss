export function getPartSize(fileSize, partSize) {
  const maxNumParts = 10 * 1000;
  const defaultPartSize = 1024 * 1024;

  if (!partSize) {
    return defaultPartSize;
  }

  return Math.max(
    Math.ceil(fileSize / maxNumParts),
    partSize
  );
}
