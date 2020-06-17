import fs from 'fs';
import _debug from 'debug';

const debug = _debug('ali-oss');

export function deleteFileSafe(filepath) {
  return new Promise((resolve) => {
    fs.exists(filepath, (exists) => {
      if (!exists) {
        resolve();
      } else {
        fs.unlink(filepath, (err) => {
          if (err) {
            debug('unlink %j error: %s', filepath, err);
          }
          resolve();
        });
      }
    });
  });
};