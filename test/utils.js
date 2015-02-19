/**!
 * ali-oss - test/utils.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var assert = require('assert');

exports.throws = function* (block, checkError) {
  try {
    yield block();
  } catch (err) {
    if (typeof checkError === 'function') {
      return checkError(err);
    }
    // throws(block, errorName)
    if (typeof checkError === 'string') {
      return assert.equal(err.name, checkError);
    }
    // throw(block, RegExp)
    if (!checkError.test(err.toString())) {
      throw new Error('expected ' + err.toString() + ' to match ' + checkError.toString());
    }
    return;
  }
  throw new Error(block.toString() + ' should throws error');
};
