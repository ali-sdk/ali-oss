const childProcess = require('child_process');

const spawn = require('cross-spawn');

const spawnObj = childProcess.spawn('node', ['server/app.js']);

spawnObj.stderr.on('data', data => {
  console.log(data.toString());
});

spawnObj.stdout.on('data', data => {
  console.log(data.toString());
});

const webpackObj = spawn('./node_modules/.bin/webpack-dev-server', ['--config', './config/webpack.dev.conf.js']);

webpackObj.stderr.on('data', data => {
  console.log(data.toString());
});

webpackObj.stdout.on('data', data => {
  console.log(data.toString());
});
