export const isArray = obj => {
  return Object.prototype.toString.call(obj) === '[object Array]';
};
