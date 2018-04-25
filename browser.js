/*
 * Export `OSS` as standalone lib which can be used in browser
 */

let OSS = require('.');
OSS.Buffer = require('buffer').Buffer;
OSS.co = require('co');
OSS.urllib = require('urllib');

module.exports = OSS;
