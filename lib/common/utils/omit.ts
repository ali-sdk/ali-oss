export function omit(originalObject: {}, keysToOmit: string[]): {} {
  const cloneObject = { ...originalObject };

  for (const path of keysToOmit) {
    delete cloneObject[path];
  }

  return cloneObject;
}
