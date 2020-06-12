export function isBlob(blob) {
  return typeof (Blob) !== 'undefined' && blob instanceof Blob;
}

