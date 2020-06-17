import { isObject } from './isObject'

function camel2Line(name) {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function formatQuery(query = {}) {
  const obj = {};
  if (isObject(query)) {
    Object.keys(query).forEach((key) => {
      obj[camel2Line(key)] = query[key];
    });
  }

  return obj;
}