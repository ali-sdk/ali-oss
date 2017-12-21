'use strict';
// require("babel-polyfill")

var $ = require('jquery');
var OSS = require('ali-oss');

var appServer = '/sts';
var bucket = '<bucket-name>';
var region = 'oss-cn-hangzhou';

var Buffer = OSS.Buffer;
var OSS = OSS.Wrapper;
var STS = OSS.STS;

// Play without STS. NOT SAFE! Because access key id/secret are
// exposed in web page.

// var client = new OSS({
//   region: 'oss-cn-hangzhou',
//   accessKeyId: '<access-key-id>',
//   accessKeySecret: '<access-key-secret>',
//   bucket: '<bucket-name>'
// });
//
// var applyTokenDo = function (func) {
//   return func(client);
// };

var applyTokenDo = function (func) {
  var url = appServer;
  return $.ajax({
    url: url
  }).then(function (result) {
    var creds = result;
    var client = new OSS({
      region: region,
      accessKeyId: creds.AccessKeyId,
      accessKeySecret: creds.AccessKeySecret,
      stsToken: creds.SecurityToken,
      bucket: bucket
    });

    return func(client);
  });
};

var progress = function (p) {
  return function (done) {
    var bar = document.getElementById('progress-bar');
    bar.style.width = Math.floor(p * 100) + '%';
    bar.innerHTML = Math.floor(p * 100) + '%';
    done();
  }
};

var uploadFile = function (client) {
  var file = document.getElementById('file').files[0];
  var key = document.getElementById('object-key-file').value.trim() || 'object';
  console.log(file.name + ' => ' + key);

  return client.multipartUpload(key, file, {
    progress: progress
  }).then(function (res) {
    console.log('upload success: %j', res);
    return listFiles(client);
  });
};

var uploadContent = function (client) {
  var content = document.getElementById('file-content').value.trim();
  var key = document.getElementById('object-key-content').value.trim() || 'object';
  console.log('content => ' + key);

  return client.put(key, new Buffer(content)).then(function (res) {
    return listFiles(client);
  });
};

var listFiles = function (client) {
  var table = document.getElementById('list-files-table');
  console.log('list files');

  return client.list({
    'max-keys': 100
  }).then(function (result) {
    var objects = result.objects.sort(function (a, b) {
      var ta = new Date(a.lastModified);
      var tb = new Date(b.lastModified);
      if (ta > tb) return -1;
      if (ta < tb) return 1;
      return 0;
    });

    var numRows = table.rows.length;
    for (var i = 1; i < numRows; i ++) {
      table.deleteRow(table.rows.length - 1);
    }

    for (var i = 0; i < Math.min(3, objects.length); i ++) {
      var row = table.insertRow(table.rows.length);
      row.insertCell(0).innerHTML = objects[i].name;
      row.insertCell(1).innerHTML = objects[i].size;
      row.insertCell(2).innerHTML = objects[i].lastModified;
    }
  });
};

var downloadFile = function (client) {
  var object = document.getElementById('dl-object-key').value.trim();
  var filename = document.getElementById('dl-file-name').value.trim();
  console.log(object + ' => ' + filename);

  var result = client.signatureUrl(object, {
    response: {
      'content-disposition': 'attachment; filename="' + filename + '"'
    }
  });
  window.location = result;

  return result;
};

window.onload = function () {
  document.getElementById('file-button').onclick = function () {
    applyTokenDo(uploadFile);
  }

  document.getElementById('content-button').onclick = function () {
    applyTokenDo(uploadContent);
  }

  document.getElementById('list-files-button').onclick = function () {
    applyTokenDo(listFiles);
  }

  document.getElementById('dl-button').onclick = function () {
    applyTokenDo(downloadFile);
  }

  applyTokenDo(listFiles);
};
