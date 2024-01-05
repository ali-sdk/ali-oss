export function getStandardRegion(str: string) {
  return str.replace(/^oss-/g, '');
}
