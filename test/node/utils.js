/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */


/**
 * Module dependencies.
 */

const assert = require('assert');
const fs = require('fs');
const urlutil = require('url');
const platform = require('platform');
const isObject = require('../../lib/common/utils/isObject');
const isArray = require('../../lib/common/utils/isArray');

exports.throws = async function (block, checkError) {
  try {
    await block();
  } catch (err) {
    if (typeof checkError === 'function') {
      return checkError(err);
    }
    // throws(block, errorName)
    if (typeof checkError === 'string') {
      return assert.equal(err.name, checkError);
    }
    // throw(block, RegExp)
    if (!checkError.test(err.toString())) {
      throw new Error(`expected ${err.toString()} to match ${checkError.toString()}`);
    }
    return false;
  }
  throw new Error(`${block.toString()} should throws error`);
};

exports.sleep = function (ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

exports.cleanBucket = async function (store, bucket, multiversion) {
  store.useBucket(bucket);
  let result;
  const options = { versionId: null };

  if (!multiversion) {
    try {
      await store.getBucketVersions({
        'max-keys': 1000
      });
      multiversion = true;
    } catch (error) {
      multiversion = false;
    }
  }

  async function handleDelete(deleteKey) {
    if (multiversion) {
      result = await store.getBucketVersions({
        'max-keys': 1000
      });
    } else {
      result = await store.list({
        'max-keys': 1000
      });
    }
    result[deleteKey] = result[deleteKey] || [];
    for (let i = 0; i < result[deleteKey].length; i++) {
      const obj = result[deleteKey][i];
      if (multiversion) {
        options.versionId = obj.versionId;
      }
      await store.delete(obj.name, options);
    }
  }
  await handleDelete('objects');
  if (multiversion) {
    await handleDelete('deleteMarker');
  }

  result = await store.listUploads({
    'max-uploads': 1000
  });
  const uploads = result.uploads || [];
  /* eslint no-await-in-loop: [0] */
  for (let i = 0; i < uploads.length; i++) {
    const up = uploads[i];
    await store.abortMultipartUpload(up.name, up.uploadId);
  }
  await store.deleteBucket(bucket);
};

if (process && process.browser) {
  exports.prefix = `${platform.name}-${platform.version}-${new Date().getTime()}/`;
} else {
  exports.prefix = `${process.platform}-${process.version}-${new Date().getTime()}/`;// unique prefix add time timestamp
  if (process && process.execPath.indexOf('iojs') >= 0) {
    exports.prefix = `iojs-${exports.prefix}`;
  }
}

exports.createTempFile = async function createTempFile(name, size) {
  const tmpdir = '/tmp/.oss/';
  if (!fs.existsSync(tmpdir)) {
    fs.mkdirSync(tmpdir);
  }

  await new Promise(((resolve, reject) => {
    const rs = fs.createReadStream('/dev/urandom', {
      start: 0,
      end: size - 1
    });
    const ws = fs.createWriteStream(tmpdir + name);
    rs.pipe(ws);
    ws.on('finish', (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  }));

  return tmpdir + name;
};

/*
 * cb = {
 *   url: 'd.rockuw.com:4567',
 *   query: {user: 'me'},
 *   contentType: 'application/json',
 *   body: '{"hello": "world"}'
 * };
 */
exports.encodeCallback = function (cb) {
  const url = urlutil.parse(cb.url);
  url.query = cb.query;

  const json = {
    callbackUrl: url.format(),
    callbackBody: cb.body,
    callbackBodyType: cb.contentType || 'application/x-www-form-urlencoded'
  };

  return Buffer.from(JSON.stringify(json)).toString('base64');
};

// 如果配置属性值是数组 则判断配置的数组是不是数据的子数组。
// 如果配置属性值是对象 则判断数据包含的属性值包不包含配置项属性值。
// 如果配置属性值是简单数据类型 则判断数据的有配置的属性且值相等
exports.includesConf = function includesConf(data, conf) {
  if (conf === null || typeof conf !== 'object') {
    return data === conf;
  }

  let valid = true;
  if (isArray(conf)) {
    if (!isArray(data)) return false;
    for (let i = 0; i < conf.length; i++) {
      let itemValid = false;
      for (let j = 0; j < data.length; j++) {
        if (includesConf(data[j], conf[i])) {
          itemValid = true;
          break;
        }
      }
      if (!itemValid) return false;
    }
    return valid;
  }

  const keys = Object.keys(conf);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!isObject(conf[key]) && !isArray(conf[key])) {
      if (conf[key] !== data[key]) {
        valid = false;
        break;
      }
    } else if (isObject(conf[key]) || isArray(conf[key])) {
      if (!includesConf(data[key], conf[key])) {
        valid = false;
        break;
      }
    } else if (conf[key] !== data[key]) {
      valid = false;
      break;
    }
  }
  return valid;
};
