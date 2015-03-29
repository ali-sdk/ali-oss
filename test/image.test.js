/**!
 * ali-oss - test/object.test.js
 *
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var cfs = require('co-fs');
var Readable = require('stream').Readable;
var utils = require('./utils');
var oss = require('../');
var config = require('./config');

var tmpdir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpdir)) {
  fs.mkdirSync(tmpdir);
}

var prefix = utils.prefix;
config.region = 'oss-cn-hangzhou';
config.bucket = ('ali-oss-test-bucket-' + prefix.replace(/[\/\.]/g, '-')).slice(0, -1);

// var imgClient = oss.ImageClient(config);
//
// module.exports = imgClient;

// describe('image.test.js', function () {
//   var prefix = utils.prefix;
//
//   before(function* () {
//   });
//
//   after(function* () {
//   });
//
//   describe('get()', function () {});
// });
