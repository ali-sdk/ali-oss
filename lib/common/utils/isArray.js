module.exports = function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};
