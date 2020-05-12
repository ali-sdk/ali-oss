module.exports = function isFile(obj) {
  return typeof (File) !== 'undefined' && obj instanceof File;
};
