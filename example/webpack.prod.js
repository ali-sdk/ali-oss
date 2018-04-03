var path = require('path');

module.exports = {
  target: 'web',
  entry: path.resolve(__dirname + "/index.js"),
  output: {
    path: path.resolve(__dirname + "/public"),
    filename: "index.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["babel-preset-es2015", {modules: false}] //fix uglifyjs not support es6
          }
        }
      }
    ]
  },
};
