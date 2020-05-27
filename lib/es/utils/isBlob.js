export default function (blob) {
  return typeof (Blob) !== 'undefined' && blob instanceof Blob;
}
