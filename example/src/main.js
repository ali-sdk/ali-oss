
// require("babel-polyfill")
require('./style.css');
const $ = require('jquery');
// if use in react , you can use require('ali-oss/dist/aliyun-oss-sdk.js'), or see webpack.prod.js
// import local for test
// const OSS = require('../../lib/browser.js');
const OSS = require('ali-oss');
const crypto = require('crypto');

const appServer = 'http://localhost:9000/sts';
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
      url
    }).then((result) => {
      const creds = result;
      const client = new OSS({
        region,
        accessKeyId: creds.AccessKeyId,
        accessKeySecret: creds.AccessKeySecret,
        stsToken: creds.SecurityToken,
        bucket
      });

      console.log(OSS.version);
      return func(client);
    });
  }
  return func();
};
let currentCheckpoint;
const progress = async function progress(p, checkpoint) {
  currentCheckpoint = checkpoint;
  const bar = document.getElementById('progress-bar');
  bar.style.width = `${Math.floor(p * 100)}%`;
  bar.innerHTML = `${Math.floor(p * 100)}%`;
};

let uploadFileClient;

let retryCount = 0;
const retryCountMax = 3;

const uploadFile = function uploadFile(client) {
  if (!uploadFileClient || Object.keys(uploadFileClient).length === 0) {
    uploadFileClient = client;
  }

  const file = document.getElementById('file').files[0];
  const key = document.getElementById('object-key-file').value.trim() || 'object';

  console.log(`${file.name} => ${key}`);
  const options = {
    progress,
    partSize: 500 * 1024,
    meta: {
      year: 2017,
      people: 'test'
    },
    timeout: 60000

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
      console.log(`err.name : ${err.name}`);
      console.log(`err.message : ${err.message}`);
      if (err.name.toLowerCase().indexOf('connectiontimeout') !== -1) {
        // timeout retry
        if (retryCount < retryCountMax) {
          retryCount++;
          console.error(`retryCount : ${retryCount}`);
          uploadFile('');
        }
      }
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
const dataURLtoFile = function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });// if env support File, also can use this: return new File([u8arr], filename, { type: mime });
};

const uploadBase64Img = function uploadBase64Img(client) {
  const base64Content = document.getElementById('base64-file-content').value.trim();
  const key = document.getElementById('base64-object-key-file').value.trim() || 'object';
  if (base64Content.indexOf('data:image') === 0) {
    const imgfile = dataURLtoFile(base64Content, 'img.png');
    client.multipartUpload(key, imgfile, {
      progress: base64progress
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
    'max-keys': 100
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

  return client.put(key, Buffer.from(content)).then(res => listFiles(client));
};

const uploadBlob = function (client) {
  const content = document.getElementById('file-blob').value.trim();
  const key = document.getElementById('object-key-blob').value.trim() || 'blob';
  console.log(`content => ${key}`);

  return client.put(key, new Blob([content], { type: 'text/plain' })).then(res => listFiles(client));
};

const putBlob = function (client) {
  const content = document.getElementById('put-blob').value.trim();
  const key = document.getElementById('object-key-put-blob').value.trim() || 'blob';
  const md5String = crypto.createHash('md5').update(Buffer.from(content, 'utf8')).digest('base64');
  const options = {
    expires: 1800,
    method: 'PUT',
    'Content-Type': 'text/plain; charset=UTF-8',
    'Content-Md5': md5String
  };
  const url = client.signatureUrl(key, options);

  return $.ajax({
    url,
    method: 'PUT',
    data: content,
    beforeSend(xhr) {
      xhr.setRequestHeader('Content-Type', 'text/plain; charset=UTF-8');
      xhr.setRequestHeader('Content-MD5', md5String);
    },
    crossDomain: true,
    complete(jqXHR, textStatus) {
      console.log(textStatus);
    }
  });
};

const downloadFile = function downloadFile(client) {
  const object = document.getElementById('dl-object-key').value.trim();
  const filename = document.getElementById('dl-file-name').value.trim();
  console.log(`${object} => ${filename}`);

  const result = client.signatureUrl(object, {
    response: {
      'content-disposition': `attachment; filename="${filename}"`
    }
  });
  window.location = result;

  return result;
};

const cnameUsage = function (cname) {
  if (!cname) {
    alert('请输入cname!');
    return;
  }
  const url = appServer;
  $.ajax({
    url
  }).then((result) => {
    const creds = result;
    const client = new OSS({
      accessKeyId: creds.AccessKeyId,
      accessKeySecret: creds.AccessKeySecret,
      stsToken: creds.SecurityToken,
      endpoint: cname,
      cname: true,
      region,
      bucket
    });

    const filename = document.getElementById('key-cname-objectName').value.trim();
    console.log(filename);

    const res = client.signatureUrl(filename, {
      response: {
        'content-disposition': `attachment; filename="${filename}"`
      }
    });
    window.location = res;
  });
};

window.onload = function () {
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

  document.getElementById('put-blob-button').onclick = function () {
    applyTokenDo(putBlob);
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

  document.getElementById('key-cname-button').onclick = function () {
    const cname = document.getElementById('key-cname').value;
    cnameUsage(cname);
  };

  applyTokenDo(listFiles);
};
