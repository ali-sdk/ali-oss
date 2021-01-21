export function isBlob(blob: any): blob is Blob {
  return typeof (Blob) !== 'undefined' && blob instanceof Blob;
}
