// copy from https://github.com/node-modules/utility for browser

exports.encodeURIComponent = function (text) {
  try {
    return encodeURIComponent(text);
  } catch (e) {
    return text;
  }
};

exports.escape = require('escape-html');

exports.timestamp = function timestamp(t) {
  if (t) {
    var v = t;
    if (typeof v === 'string') {
      v = Number(v);
    }
    if (String(t).length === 10) {
      v *= 1000;
    }
    return new Date(v);
  }
  return Math.round(Date.now() / 1000);
};
