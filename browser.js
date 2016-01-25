/*
 * Export `OSS` as standalone lib which can be used in browser
 */

require('babel-polyfill');

var OSS = require('.');
OSS.co = require('co');
OSS.urllib = require('urllib');

module.exports = OSS;
