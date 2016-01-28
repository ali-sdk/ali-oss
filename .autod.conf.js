module.exports = {
  write: true,
  prefix: '~',
  devprefix: '^',
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
    'publish.js'
  ],
};
