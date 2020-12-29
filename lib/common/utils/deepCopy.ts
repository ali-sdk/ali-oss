import { isBuffer } from './isBuffer';

export const deepCopy = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (isBuffer(obj)) {
    return Buffer.from(obj);
  }

  const copy = Array.isArray(obj) ? [] : {};

  Object.keys(obj).forEach((key) => {
    copy[key] = deepCopy(obj[key]);
  });

  return copy;
};
