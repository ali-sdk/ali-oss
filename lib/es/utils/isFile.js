export default function (obj) {
  return typeof (File) !== 'undefined' && obj instanceof File;
}

