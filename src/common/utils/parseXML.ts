import xml from 'xml2js';

/**
 * thunkify xml.parseString
 * @param {String|Buffer} str
 *
 */

export function parseXML(str) {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(str)) {
      str = str.toString();
    }
    xml.parseString(str, {
      explicitRoot: false,
      explicitArray: false
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};