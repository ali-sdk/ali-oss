export const isArray = (obj: any): obj is any[] => {
  if (Array.isArray) {
    return Array.isArray(obj);
  }
  return Object.prototype.toString.call(obj) === '[object Array]';
};
