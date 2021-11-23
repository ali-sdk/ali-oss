#! /usr/bin/env node

var path = require('path');
var pkg = require('./package.json');
var fs = require('fs');

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

  function writeVersion(location, version) {
    const data = fs.readFileSync(location)
    const content = data.toString().replace(/(.*exports.version = '|.*export const version = ')(.*?)('.*)/, (...args) => {
      args = args.slice(1, 4)
      args.splice(1, 1, version)
      return args.join('')
    })
    fs.writeFileSync(location, content);
  }

  writeVersion(path.resolve(__dirname, './lib/browser/version.js'), pkg.version)
  writeVersion(path.resolve(__dirname, './src/browser/version.ts'), pkg.version)
  var browserify = require('browserify');
  var aliasify = require('aliasify');
  var babelify = require('babelify');

  var brOpts = {
    basedir: path.resolve(__dirname, '.'),
    fullPaths: false,
    standalone: 'OSS',
    debug: false,
    builtins: {
      ...require("browserify/lib/builtins"),
      _process: path.join(__dirname, "shims/process.js"),
      url: path.join(__dirname, "shims/url/index.js")
    }
  };
  browserify(brOpts).add('./lib/browser/index.js')
    .transform(babelify, {
      "global": true,
      "presets": [
        [
          "@babel/preset-env",
          {
            "useBuiltIns": "usage",
            "corejs": 3,
            "targets": {
              "chrome": "58",
              "ie": "10"
            }
          }
        ],
      ],
      "plugins": ["@babel/plugin-transform-runtime", "@babel/plugin-transform-regenerator"],
      "only": ['lib/*', 'shims/*', 'shims/crypto/*'],
    }).transform(aliasify, {
      global: true,
      aliases: {
        'zlib': false,
        'iconv-lite': false,
        'crypto': './shims/crypto/crypto.js',
      },
      verbose: false
    }).bundle(function(err, data) {
      if (err) return callback(err);

      var code = (data || '').toString();
      if (options.minify) {
        var uglify = require('uglify-js');
        var minified = uglify.minify(code, {
          output: {
            'ascii_only': true
          }
        });
        if (minified.error) {
          console.error(minified.error);
          process.exit(1);
        }
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
