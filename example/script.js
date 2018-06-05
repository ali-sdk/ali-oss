let  child_process = require('child_process');

let spawnObj = child_process.spawn('node', ['server/app.js']);

spawnObj.stderr.on('data', (data) => {
  console.log(data.toString());
});

spawnObj.stdout.on('data', (data) => {
  console.log(data.toString());
});

let webpackObj = child_process.spawn('./node_modules/.bin/webpack-dev-server', ['--config','./config/webpack.dev.conf.js']);

webpackObj.stderr.on('data', (data) => {
  console.log(data.toString());
});

webpackObj.stdout.on('data', (data) => {
  console.log(data.toString());
});