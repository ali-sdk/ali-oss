'use strict';

// require("babel-polyfill")

const $ = require('jquery');
// if use in react , you can use require('ali-oss/dist/aliyun-oss-sdk.js'), or see webpack.prod.js
const OSS = require('ali-oss');

const appServer = '/sts';
const bucket = '<bucket-name>';
const region = 'oss-cn-hangzhou';
const { Buffer } = OSS;


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

const applyTokenDo = function (func, refreshSts) {
  const refresh = typeof (refreshSts) !== 'undefined' ? refreshSts : true;
  if (refresh) {
    const url = appServer;
    return $.ajax({
      url,
    }).then((result) => {
      const creds = result;
      const client = new OSS({
        region,
        accessKeyId: creds.AccessKeyId,
        accessKeySecret: creds.AccessKeySecret,
        stsToken: creds.SecurityToken,
        bucket,
      });

      console.log(OSS.version);
      return func(client);
    });
  }
  return func();
};
let currentCheckpoint;
const progress = function progress(p, checkpoint) {
  currentCheckpoint = checkpoint;
  const bar = document.getElementById('progress-bar');
  bar.style.width = `${Math.floor(p * 100)}%`;
  bar.innerHTML = `${Math.floor(p * 100)}%`;
};

let uploadFileClient;

const uploadFile = function uploadFile(client) {
  if (!uploadFileClient || Object.keys(uploadFileClient).length === 0) {
    uploadFileClient = client;
  }

  const file = document.getElementById('file').files[0];
  const key = document.getElementById('object-key-file').value.trim() || 'object';

  console.log(`${file.name} => ${key}`);
  const options = {
    progress,
    partSize: 100 * 1024,
    meta: {
      year: 2017,
      people: 'test',
    },
  };
  if (currentCheckpoint) {
    options.checkpoint = currentCheckpoint;
  }
  return uploadFileClient.multipartUpload(key, file, options).then((res) => {
    console.log('upload success: %j', res);
    currentCheckpoint = null;
    uploadFileClient = null;
  }).catch((err) => {
    if (uploadFileClient && uploadFileClient.isCancel()) {
      console.log('stop-upload!');
    } else {
      console.error(err);
    }
  });
};

const base64progress = function base64progress(p) {
  const bar = document.getElementById('base64-progress-bar');
  bar.style.width = `${Math.floor(p * 100)}%`;
  bar.innerHTML = `${Math.floor(p * 100)}%`;
};

/**
 * base64 to file
 * @param dataurl   base64 content
 * @param filename  set up a meaningful suffix, or you can set mime type in options
 * @returns {File|*}
 */
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}


const uploadBase64Img = function uploadBase64Img(client) {
  const base64Content = document.getElementById('base64-file-content').value.trim();
  const key = document.getElementById('base64-object-key-file').value.trim() || 'object';
  if (base64Content.indexOf('data:image') === 0) {
    const imgfile = dataURLtoFile(base64Content, 'img.png');
    client.multipartUpload(key, imgfile, {
      progress: base64progress,
    }).then((res) => {
      console.log('upload success: %j', res);
    }).catch((err) => {
      console.error(err);
    });
  } else {
    alert('Please fill in the correct Base64 img');
  }
};

const listFiles = function listFiles(client) {
  const table = document.getElementById('list-files-table');
  console.log('list files');

  return client.list({
    'max-keys': 100,
  }).then((result) => {
    const objects = result.objects.sort((a, b) => {
      const ta = new Date(a.lastModified);
      const tb = new Date(b.lastModified);
      if (ta > tb) return -1;
      if (ta < tb) return 1;
      return 0;
    });

    const numRows = table.rows.length;
    for (let i = 1; i < numRows; i++) {
      table.deleteRow(table.rows.length - 1);
    }

    for (let i = 0; i < Math.min(3, objects.length); i++) {
      const row = table.insertRow(table.rows.length);
      row.insertCell(0).innerHTML = objects[i].name;
      row.insertCell(1).innerHTML = objects[i].size;
      row.insertCell(2).innerHTML = objects[i].lastModified;
    }
  });
};

/* eslint no-unused-vars: [0] */
const uploadContent = function uploadContent(client) {
  const content = document.getElementById('file-content').value.trim();
  const key = document.getElementById('object-key-content').value.trim() || 'object';
  console.log(`content => ${key}`);

  return client.put(key, new Buffer(content)).then(res => listFiles(client));
};

const uploadBlob = function (client) {
  const content = document.getElementById('file-blob').value.trim();
  const key = document.getElementById('object-key-blob').value.trim() || 'blob';
  console.log(`content => ${key}`);

  return client.put(key, new Blob([content], { type: 'text/plain' })).then(res => listFiles(client));
}


const downloadFile = function downloadFile(client) {
  const object = document.getElementById('dl-object-key').value.trim();
  const filename = document.getElementById('dl-file-name').value.trim();
  console.log(`${object} => ${filename}`);

  const result = client.signatureUrl(object, {
    response: {
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
  window.location = result;

  return result;
};

window.onload = function onload() {
  document.getElementById('file-button').onclick = function () {
    if (uploadFileClient) {
      applyTokenDo(uploadFile, false);
    } else {
      applyTokenDo(uploadFile);
    }
  };

  document.getElementById('file-button-stop').onclick = function () {
    if (uploadFileClient) {
      uploadFileClient.cancel();
    }
  };

  document.getElementById('content-button').onclick = function () {
    applyTokenDo(uploadContent);
  };

  document.getElementById('blob-button').onclick = function () {
    applyTokenDo(uploadBlob);
  };

  document.getElementById('list-files-button').onclick = function () {
    applyTokenDo(listFiles);
  };

  document.getElementById('dl-button').onclick = function () {
    applyTokenDo(downloadFile);
  };

  document.getElementById('base64-file-button').onclick = function () {
    applyTokenDo(uploadBase64Img);
  };

  applyTokenDo(listFiles);
};
