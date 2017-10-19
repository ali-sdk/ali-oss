"use strict";

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'browserify'],
    browsers: ['Chrome'],
    // browsers: ['Firefox'],
    files: [
      'test/browser/build/aliyun-oss-sdk.js',

      'node_modules/co-mocha/co-mocha.js',
      'test/browser/build/tests.js'
    ],
    preprocessors: {
      // 'dist/aliyun-oss-sdk.js': ['coverage']
    },
    // coverageReporter: {
    //   type : 'html',
    //   dir : 'coverage-browser/'
    // },
    proxies: {
      '/sts': {
        'target': 'http://127.0.0.1:3000',
        'changeOrigin': true
      }
    },
    // reporters: ['progress', 'coverage'],
    reporters: ['progress'],
    port: 19876,
    colors: true,
    logLevel: config.LOG_INFO,
    singleRun: true,
    concurrency: Infinity
  });
}
