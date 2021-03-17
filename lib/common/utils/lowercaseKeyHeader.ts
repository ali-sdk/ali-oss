import { isObject } from './isObject';

export function lowercaseKeyHeader(headers) {
  const lowercaseHeader = {};
  if (isObject(headers)) {
    Object.keys(headers).forEach(key => {
      lowercaseHeader[key.toLowerCase()] = headers[key];
    });
  }
  return lowercaseHeader;
}
