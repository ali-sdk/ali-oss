#! /usr/bin/env node

const path = require('path');
const pkg = require('./package.json');
const fs = require('fs');
const babelify = require('babelify');
const browserify = require('browserify');
const aliasify = require('aliasify');
const uglify = require('uglify-js');

const license =
  [
    '// Aliyun OSS SDK for JavaScript v' + pkg.version,
    '// Copyright Aliyun.com, Inc. or its affiliates. All Rights Reserved.',
    '// License at https://github.com/ali-sdk/ali-oss/blob/master/LICENSE'
  ].join('\n') + '\n';

function build(options, callback) {
  if (arguments.length === 1) {
    callback = options;
    options = {};
  }

  console.error('Building with options: %j %j', options, pkg.version);

  const verStr = `exports.version = '${pkg.version}';`;
  fs.writeFileSync(path.resolve(__dirname + '/lib/browser/version.js'), verStr);

  const brOpts = {
    basedir: path.resolve(__dirname, '.'),
    fullPaths: false,
    standalone: 'OSS',
    debug: false,
    builtins: {
      ...require('browserify/lib/builtins'),
      _process: path.join(__dirname, 'shims/process.js'),
      url: path.join(__dirname, 'shims/url/index.js'),
      http: path.join(__dirname, 'shims/stream-http/index.js')
    }
  };
  browserify(brOpts)
    .add('./lib/browser.js')
    .transform(babelify, {
      global: true,
      presets: [
        [
          '@babel/preset-env',
          {
            useBuiltIns: 'usage',
            corejs: 3,
            targets: {
              chrome: '58',
              ie: '10'
            }
          }
        ]
      ],
      plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-transform-regenerator'],
      only: [
        'lib/*',
        'shims/*',
        'shims/crypto/*',
        'node_modules/mime/*',
        'node_modules/mime-db/*',
        'node_modules/mimic-fn/*',
        'node_modules/mime-types/*'
      ]
    })
    .transform(aliasify, {
      global: true,
      aliases: {
        zlib: false,
        'iconv-lite': false,
        crypto: './shims/crypto/crypto.js'
      },
      verbose: false
    })
    .bundle(function (err, data) {
      if (err) return callback(err);

      let code = (data || '').toString();
      if (options.minify) {
        const minified = uglify.minify(code, {
          output: {
            ascii_only: true
          }
        });
        if (minified.error) {
          console.error(minified.error);
          process.exit(1);
        }
        code = minified.code;
      }
      code = license + `(function(global){${code}})(window)`;
      callback(null, code);
    });
}

// run if we called this tool directly
if (require.main === module) {
  const opts = {
    // 高版本环境变量变成了字符串
    minify: process.env.MINIFY == 1 ? true : false
  };

  build(opts, function (err, code) {
    if (err) console.error(err.message);
    else console.log(code);
  });
}

module.exports = build;
