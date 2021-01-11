import { isBuffer } from './isBuffer';

export const deepCopy = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (isBuffer(obj)) {
    return obj.slice();
  }

  const copy = Array.isArray(obj) ? [] : {};

  Object.keys(obj).forEach((key) => {
    copy[key] = deepCopy(obj[key]);
  });

  return copy;
};

export const deepCopyWith = (obj: any, customizer?: (v: any, k: string, o: any) => any) => {
  function deepCopyWithHelper(value: any, innerKey: string, innerObject: any) {
    const result = customizer!(value, innerKey, innerObject);
    if (result !== undefined) return result;

    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (isBuffer(value)) {
      return value.slice();
    }

    const copy = Array.isArray(value) ? [] : {};

    Object.keys(value).forEach((k) => {
      copy[k] = deepCopyWithHelper(value[k], k, value);
    });

    return copy;
  }

  if (customizer) {
    return deepCopyWithHelper(obj, '', null);
  } else {
    return deepCopy(obj);
  }

};
