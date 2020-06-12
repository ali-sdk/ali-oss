export function formatObjKey(obj: any, type: string) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  let o:any;
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
}

function handelFormat(key: string, type: string) {
  if (type === 'firstUpperCase') {
    key = key.replace(/^./, (_: string) => _.toUpperCase());
  } else if (type === 'firstLowerCase') {
    key = key.replace(/^./, (_: string) => _.toLowerCase());
  }
  return key;
}
