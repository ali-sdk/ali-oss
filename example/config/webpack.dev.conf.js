const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const HtmlWebpackPluginConfig = {
  filename: 'index.html',
  template: './template/index.html',
  inject: 'body'
};

module.exports = {
  context: path.resolve(__dirname, '../src'),
  entry: './main',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: './[hash]app.js',
    hashDigestLength: 8
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(eot|woff|woff2)$/,
        loader: 'file-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin(HtmlWebpackPluginConfig),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default']
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, '../dist'),
    port: 3000,
    host: '127.0.0.1',
    open: true, // open browser auto
    index: 'index.html', // like HtmlWebpackPlugin
    inline: true, // default:true
    hot: false,
    compress: true // compress
  }
};
