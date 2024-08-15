#! /usr/bin/env node
'use strict';

var oss = require('..');
var env = process.env;
var STS = oss.STS;
var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var aliasify = require('aliasify');
var babelify = require('babelify');

function build(options, callback) {
  if (arguments.length === 1) {
    callback = options;
    // options = {};
  }

  var conf = {
    accessKeyId: env.ALI_SDK_STS_ID,
    accessKeySecret: env.ALI_SDK_STS_SECRET,
    roleArn: env.ALI_SDK_STS_ROLE,
    bucket: env.ALI_SDK_STS_BUCKET,
    region: env.ALI_SDK_STS_REGION
  };

  var store = STS({
    accessKeyId: conf.accessKeyId,
    accessKeySecret: conf.accessKeySecret
  });

  store.assumeRole(conf.roleArn).then(result => {
    var stsConf = JSON.parse(result.res.data);
    var tmpdir = path.join(__dirname, '../test/browser/.tmp');
    var stsConfFile = tmpdir + '/stsConfig.json';
    if (!fs.existsSync(tmpdir)) {
      fs.mkdirSync(tmpdir);
    }
    fs.writeFile(
      stsConfFile,
      JSON.stringify(
        Object.assign({}, stsConf, {
          // callbackServer: env.ALI_SDK_CALLBACK_IP,
          bucket: conf.bucket,
          region: conf.region
        })
      ),
      () => {
        var brOpts = {
          basedir: path.resolve(__dirname, '.'),
          fullPaths: false,
          debug: true
        };
        browserify(brOpts)
          .add(['../test/browser/browser.test.js'])
          .transform(babelify, {
            global: true,
            presets: ['es2015'],
            plugins: ['transform-runtime', 'babel-plugin-transform-regenerator'],
            only: ['testbrowser/*', 'browser/*', 'lib/*', 'shims/*']
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
            var code = (data || '').toString();
            fs.unlinkSync(stsConfFile);
            callback(null, code);
          });
      }
    );
  });
}

// run if we called this tool directly
if (require.main === module) {
  var opts = {
    minify: process.env.MINIFY ? true : false
  };

  build(opts, function (err, code) {
    if (err) console.error(err.message);
    else console.log(code);
  });
}

module.exports = build;
