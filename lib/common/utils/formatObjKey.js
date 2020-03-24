/* eslint-disable no-use-before-define */
module.exports = function formatObjKey(obj, type) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  let o;
  if (Array.isArray(obj)) {
    o = [];
    for (let i = 0; i < obj.length; i++) {
      o.push(formatObjKey(obj[i], type));
    }
  } else {
    o = {};
    Object.keys(obj).forEach((key) => {
      o[handelFormat(key, type)] = formatObjKey(obj[key], type);
    });
  }
  return o;
};

function handelFormat(key, type) {
  if (type === 'firstUpperCase') {
    key = key.replace(/^./, _ => _.toUpperCase());
  } else if (type === 'firstLowerCase') {
    key = key.replace(/^./, _ => _.toLowerCase());
  }
  return key;
}
