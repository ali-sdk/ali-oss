/* eslint max-len: [0] */
module.exports = {
  extends: 'airbnb',
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
    jasmine: true,
    jest: true,
  },
  rules: {
    indent: ['error', 2],
    // override default options
    'no-underscore-dangle': [0],
    'no-plusplus': [0],
    'no-return-await':[0],
    'no-param-reassign': [0],
    'max-len': ['warn', 120, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'no-buffer-constructor': [2],
    "comma-dangle": [2, "never"],
  }
};
