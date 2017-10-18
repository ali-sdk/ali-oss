"use strict";

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'browserify'],
    browsers: ['Chrome'],
    // browsers: ['Firefox'],
    files: [
      // 'node_modules/promise-polyfill/promise.min.js',
      'node_modules/co-mocha/co-mocha.js',
      'test/browser/build/tests.js'
    ],
    proxies: {
      '/sts': {
        'target': 'http://127.0.0.1:3000',
        'changeOrigin': true
      }
    },
    reporters: ['progress'],
    port: 19876,
    colors: true,
    logLevel: config.LOG_INFO,
    // autoWatch: true,
    singleRun: true,
    concurrency: Infinity
  });
}
