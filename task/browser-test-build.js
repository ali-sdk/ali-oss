#! /usr/bin/env node
"use strict";

var path = require('path');

function build(options, callback) {
  if (arguments.length === 1) {
    callback = options;
    // options = {};
  }

  var browserify = require('browserify');
  var aliasify = require('aliasify');
  var babelify = require('babelify');

  var brOpts = {
    basedir: path.resolve(__dirname, '.'),
    fullPaths: false,
  };
  browserify(brOpts).add(['../test/browser.tests.js', ])
    .transform(babelify, {
      "global": true,
      "presets": ["es2015"],
      "plugins": ["transform-runtime"],
      "only": ['test/*', 'browser/*','lib/*', 'node_modules/co-gather/*', 'shims/*'],
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
      // if (options.minify) {
      //   var uglify = require('uglify-js');
      //   var minified = uglify.minify(code, {fromString: true});
      //   code = minified.code;
      // }
      // code = license + code;
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
