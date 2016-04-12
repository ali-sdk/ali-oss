#! /usr/bin/env node

var path = require('path');
var pkg = require('./package.json');

var license = [
  '// Aliyun OSS SDK for JavaScript v' + pkg.version,
  '// Copyright Aliyun.com, Inc. or its affiliates. All Rights Reserved.',
  '// License at https://github.com/ali-sdk/ali-oss/blob/master/LICENSE'
].join('\n') + '\n';

function build(options, callback) {
  if (arguments.length === 1) {
    callback = options;
    options = {};
  }

  console.error('Building with options: %j', options);

  var browserify = require('browserify');
  var aliasify = require('aliasify');
  var babelify = require('babelify');

  var brOpts = {
    basedir: path.resolve(__dirname, '.'),
    fullPaths: false,
    standalone: 'OSS'
  };
  browserify(brOpts).add('./browser.js')
    .transform(babelify, {
        "presets": ["es2015"],
        "plugins": ["transform-runtime"]
    }).transform(aliasify, {
      global: true,
      aliases: {
        'zlib': false,
        'iconv-lite': false,
        'crypto': './shims/crypto.js',
      },
      verbose: false
    }).bundle(function(err, data) {
      if (err) return callback(err);

      var code = (data || '').toString();
      if (options.minify) {
        var uglify = require('uglify-js');
        var minified = uglify.minify(code, {fromString: true});
        code = minified.code;
      }
      code = license + code;
      callback(null, code);
  });
}

// run if we called this tool directly
if (require.main === module) {
  var opts = {
    minify: process.env.MINIFY ? true : false
  };

  build(opts, function(err, code) {
    if (err) console.error(err.message);
    else console.log(code);
  });
}

module.exports = build;
