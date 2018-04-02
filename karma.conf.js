

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'browserify'],
    browsers: ['Chrome', 'Safari'],
    files: [
      'test/browser/build/aliyun-oss-sdk.js',

      'node_modules/co-mocha/co-mocha.js',
      'test/browser/build/tests.js',
    ],
    preprocessors: {
      // 'dist/aliyun-oss-sdk.js': ['coverage']
    },
    // coverageReporter: {
    //   type : 'html',
    //   dir : 'coverage-browser/'
    // },
    // reporters: ['progress', 'coverage'],
    reporters: ['progress'],
    port: 19876,
    colors: true,
    logLevel: config.LOG_INFO,
    singleRun: true,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 30000,
    concurrency: 1,
    client: {
      mocha: {
        timeout: 6000,
      },
    },
  });
};
