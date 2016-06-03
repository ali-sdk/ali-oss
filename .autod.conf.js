module.exports = {
  write: true,
  prefix: '^',
  devdep: [
    'mocha',
    'autod',
    'should',
    'thunk-mocha',
    'istanbul',
    'git-pre-hooks'
  ],
  exclude: [
    'dist',
    'browser.js',
    'publish.js',
    'shims',
  ],
  test: [
    'browser-build.js'
  ],
};
