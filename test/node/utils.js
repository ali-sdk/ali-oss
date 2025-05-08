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
const { isObject } = require('../../lib/common/utils/isObject');
const { isArray } = require('../../lib/common/utils/isArray');
const OSS = require('../..');

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
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

/**
 * limit ： 最多一次清理多少个bucket
 * isAll = false，只清理24小时之前的bucket
 */
exports.cleanAllBucket = async (store, limit, isAll) => {
  const res = await store.listBuckets();
  const bucketList = [];

  const interval = new Date().getTime() - 24 * 60 * 60 * 1000;
  const calculateData = bucket => {
    return parseInt(bucket.split('-').pop(), 10);
  };

  res.buckets.forEach(i => {
    if (i.name.indexOf('ali-oss-') === 0 && isAll) {
      bucketList.push({
        bucket: i.name,
        region: i.region
      });
    }
    // Only clean buckets 24 hours ago
    if (i.name.indexOf('ali-oss-') === 0 && !isAll && calculateData(i.name) < interval) {
      bucketList.push({
        bucket: i.name,
        region: i.region
      });
    }
  });

  const proDelete = async () => {
    const list = bucketList.splice(0, limit);
    const pros = [];
    for (const bucketListItem of list) {
      //   store.options.endpoint.parse(`https://${bucketListItem.region}.aliyuncs.com`);
      const client = new OSS({
        ...JSON.parse(JSON.stringify(store.options)),
        bucket: bucketListItem.bucket,
        region: bucketListItem.region,
        maxSocket: 50
      });
      try {
        const delRes = this.cleanBucket(client, bucketListItem.bucket);
        pros.push(delRes);
      } catch (e) {
        console.error('cleanBucket-error', e.requestId);
      }
    }
    await Promise.all(pros);
    if (bucketList.length > 0) await proDelete();
  };
  await proDelete();
};

exports.cleanBucket = async function (store, bucket, multiversion) {
  store.useBucket(bucket);
  let result;
  const options = { versionId: null };
  let isMs = multiversion;
  if (!multiversion) {
    try {
      await store.getBucketVersions({ 'max-keys': 1000 }, { timeout: 6 * 60 * 60 * 1000 });
      isMs = true;
    } catch (error) {
      isMs = false;
    }
  }

  async function handleDelete(deleteKey) {
    if (isMs) {
      result = await store.getBucketVersions({ 'max-keys': 1000 }, { timeout: 6 * 60 * 60 * 1000 });
    } else {
      result = await store.list({
        'max-keys': 1000
      });
    }
    result[deleteKey] = result[deleteKey] || [];
    const list = result[deleteKey].map(_ => {
      return store.delete(_.name, isMs ? Object.assign({}, options, { versionId: _.versionId }) : options);
    });
    await Promise.all(list);
  }
  await handleDelete('objects');
  if (multiversion) {
    await handleDelete('deleteMarker');
  }

  result = await store.listUploads({
    'max-uploads': 1000
  });
  const uploads = result.uploads || [];
  await Promise.all(uploads.map(_ => store.abortMultipartUpload(_.name, _.uploadId)));
  if (store.cloudBoxId !== undefined) {
    const channels = (await store.listChannels()).channels.map(_ => _.Name);
    await Promise.all(channels.map(_ => store.deleteChannel(_)));
  }

  await store.deleteBucket(bucket);
};

if (process && process.browser) {
  exports.prefix = `${platform.name}-${platform.version}-${new Date().getTime()}/`;
} else {
  exports.prefix = `${process.platform}-${process.version}-${new Date().getTime()}/`; // unique prefix add time timestamp
  if (process && process.execPath.indexOf('iojs') >= 0) {
    exports.prefix = `iojs-${exports.prefix}`;
  }
}

exports.createTempFile = async function createTempFile(name, size) {
  const tmpdir = '/tmp/.oss/';
  if (!fs.existsSync(tmpdir)) {
    fs.mkdirSync(tmpdir);
  }

  await new Promise((resolve, reject) => {
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
  });

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
