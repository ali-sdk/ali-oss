const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const config = require('../config').oss;
const fs = require('fs');
const ms = require('humanize-ms');
const { metaSyncTime } = require('../config');

describe('test/multiversion.test.js', () => {
  const { prefix } = utils;
  const enabled = 'Enabled';
  const suspended = 'Suspended';
  let store;
  let bucket;
  before(async () => {
    // config.region = 'oss-cn-chengdu';
    store = oss(config);

    bucket = `ali-oss-test-bucket-multiversion-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);

    const result = await store.putBucket(bucket);
    store.useBucket(bucket);
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);

    // 用于产生versionId为null的版本
    await store.put('test-version-null', Buffer.from('test-version-null'));
  });

  after(async () => {
    await utils.cleanBucket(store, bucket, true);
  });

  describe('putBucketVersioning() getBucketVersioning()', () => {
    it('should set bucket version', async () => {
      try {
        const result = await store.getBucketVersioning(bucket);
        assert.strictEqual(result.versionStatus, undefined);

        const put1 = await store.putBucketVersioning(bucket, enabled);
        assert.strictEqual(put1.status, 200);
        const result1 = await store.getBucketVersioning(bucket);
        assert.strictEqual(result1.versionStatus, enabled);

        const put2 = await store.putBucketVersioning(bucket, suspended);
        assert.strictEqual(put2.status, 200);
        const result2 = await store.getBucketVersioning(bucket);
        assert.strictEqual(result2.versionStatus, suspended);
      } catch (err) {
        assert(false, err.message);
      }
    });
  });

  describe('getBucketVersions()', () => {
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      const name = `${prefix}-getBucketVersions-file.js`;
      const name1 = `${prefix}-getBucketVersions-file1.js`;
      await store.put(name, __filename);
      await store.delete(name);
      await store.put(name, __filename);
      await store.put(name1, __filename);
      await store.delete(name1);
      await store.put(name1, __filename);
    });

    it('should getBucketVersions', async () => {
      try {
        const result = await store.getBucketVersions();
        assert.strictEqual(result.res.status, 200);
        assert.strictEqual(result.deleteMarker && result.deleteMarker.length, 2);
        assert(result.objects && result.objects.length > 4);
      } catch (err) {
        assert(false, err.message);
      }
    });

    it('should getBucketVersions with maxKeys', async () => {
      try {
        let result = await store.getBucketVersions({
          maxKeys: 3
        });
        assert(result.objects.length + result.deleteMarker.length === 3);
        result = await store.getBucketVersions({
          maxKeys: 4
        });
        assert(result.objects.length + result.deleteMarker.length === 4);
      } catch (err) {
        assert(false, err.message);
      }
    });
    it('should getBucketVersions with delimiter', async () => {
      const names = ['getBucketVersions/delimiter1.js', 'getBucketVersions/delimiter2.js', 'getBucketVersions/delimiter3.js', 'others.js'];
      await Promise.all(names.map(_name => store.put(_name, __filename)));
      try {
        const result = await store.getBucketVersions({
          delimiter: '/'
        });
        assert(result.prefixes && result.prefixes.includes('getBucketVersions/'));
      } catch (err) {
        assert(false, err.message);
      }
    });
  });

  describe('putBucketLifecycle() getBucketLifecycle()', async () => {
    it('should putBucketLifecycle with NoncurrentVersionExpiration', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'expiration1',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          days: 1
        },
        noncurrentVersionExpiration: {
          noncurrentDays: 1
        }
      }], {
        timeout: 120000
      });
      await utils.sleep(ms(metaSyncTime));
      assert.strictEqual(putresult1.res.status, 200);
      const { rules } = await store.getBucketLifecycle(bucket);
      assert.strictEqual(rules[0].noncurrentVersionExpiration.noncurrentDays, '1');
    });
    it('should putBucketLifecycle with expiredObjectDeleteMarker', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'expiration1',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          expiredObjectDeleteMarker: 'true'
        },
        NoncurrentVersionExpiration: {
          noncurrentDays: 1
        }
      }]);
      assert.equal(putresult1.res.status, 200);
      const { rules } = await store.getBucketLifecycle(bucket);
      assert.strictEqual(rules[0].expiration.expiredObjectDeleteMarker, 'true');
    });

    it('should putBucketLifecycle with noncurrentVersionTransition', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [
        {
          id: 'expiration1',
          prefix: 'logs/',
          status: 'Enabled',
          noncurrentVersionTransition: {
            noncurrentDays: '10',
            storageClass: 'IA'
          }
        }
      ]);
      assert.equal(putresult1.res.status, 200);
      const { rules } = await store.getBucketLifecycle(bucket);
      const [
        {
          noncurrentVersionTransition: { noncurrentDays, storageClass }
        }
      ] = rules;
      assert(noncurrentDays === '10' && storageClass === 'IA');
    });
  });

  describe('copy()', () => {
    let versionId;
    const name = `${prefix}-multiversion-copy-file.js`;
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      const result = await store.put(name, __filename);
      await utils.sleep(ms(metaSyncTime));
      await store.delete(name);
      versionId = result.res.headers['x-oss-version-id'];
    });

    // 指定version id进行拷贝，拷贝指定版本
    it('should copy', async () => {
      const target = `${name.replace('file.js', 'file-target.js')}`;
      try {
        const result = await store.copy(target, name, {
          versionId
        });
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });

    // 不指定version id进行拷贝，拷贝最新版本
    it('should copy latest object when no versionId', async () => {
      const target = `${name.replace('file.js', 'file-target-latest.js')}`;
      const content = 'latest file';
      await store.put(name, Buffer.from(content));
      try {
        const result = await store.copy(target, name);
        assert.strictEqual(result.res.status, 200);
        const targetRes = await store.get(target);
        assert.strictEqual(targetRes.content.toString(), content);
      } catch (error) {
        assert(false);
      }
    });

    // 暂停多版本, 进行copy, copy后object的versionId为null
    it('should copy latest object with versionId `null` when the bucket is suspended', async () => {
      const target = `${name.replace('file.js', 'file-target-suspended.js')}`;
      const suspendedRes = await store.putBucketVersioning(bucket, suspended);
      assert.strictEqual(suspendedRes.res.status, 200);
      try {
        const result = await store.copy(target, name, {
          versionId
        });
        assert.strictEqual(result.res.status, 200);
        assert.strictEqual(result.res.headers['x-oss-version-id'], 'null');
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('head()', () => {
    const name = `${prefix}-multiversion-copy-file.js`;
    let versionId;
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      const result = await store.put(name, __filename);
      store.delete(name);
      versionId = result.res.headers['x-oss-version-id'];
    });

    it('should head info', async () => {
      try {
        const result = await store.head(name, { versionId });
        assert.strictEqual(result.res.headers['x-oss-version-id'], versionId);
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('multipartUploadCopy()', () => {
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
    });

    it('should multipartUploadCopy', async () => {
      const file = await utils.createTempFile('multipart-upload-file', 102410);
      const objectKey = `${prefix}multipart-copy-source.js`;
      const { res: sourceRes } = await store.multipartUpload(objectKey, file);
      const versionId = sourceRes.headers['x-oss-version-id'];
      store.delete(objectKey);
      const copyName = `${prefix}multipart-copy-target.js`;
      try {
        const result = await store.multipartUploadCopy(copyName, {
          sourceKey: objectKey,
          sourceBucketName: bucket
        }, {
          versionId
        });
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('deleteMulti()', () => {
    let name = `${prefix}-multiversion-deleteMulti-file.js`;
    const arr = [];
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      let result;
      const _createHistoryObject = async (i) => {
        name = name.replace('file', `file${i}`);
        result = await store.put(name, __filename);
        await store.delete(name);
        arr.push({
          key: name,
          versionId: result.res.headers['x-oss-version-id']
        });
      };
      await Promise.all(Array(3).fill(1).map((_, i) => _createHistoryObject(i)));
    });

    it('should deleteMulti', async () => {
      try {
        const result = await store.deleteMulti(arr);
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('restore()', () => {
    const name = `${prefix}-multiversion-restore-file.js`;
    let putResult;
    let versionId;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      const headers = {
        'x-oss-storage-class': 'Archive'
      };
      putResult = await store.put(name, __filename, { headers });
      versionId = putResult.res.headers['x-oss-version-id'];
    });

    it('should restore', async () => {
      const head = await store.head(name);
      assert.strictEqual(head.res.headers['x-oss-storage-class'], 'Archive');
      // 删除版本使成为历史版本
      await store.delete(name);
      try {
        const result = await store.restore(name, {
          versionId
        });
        assert.strictEqual(result.res.status, 202);

        await store.restore(name, {
          versionId
        });
      } catch (error) {
        if (error.status === 409) {
          assert(true);
        } else {
          assert(false);
        }
      }
    });
  });

  describe('putACL()', () => {
    const name = `${prefix}-multiversion-putACL-file.js`;
    let putResult;
    let versionId;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      putResult = await store.put(name, __filename);
      await store.delete(name);
      versionId = putResult.res.headers['x-oss-version-id'];
    });

    it('should putACL', async () => {
      try {
        const result = await store.putACL(name, 'public-read', {
          versionId
        });
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('getACL()', () => {
    const name = `${prefix}-multiversion-getACL-file.js`;
    let putResult;
    let versionId;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      putResult = await store.put(name, __filename);
      await store.delete(name);
      versionId = putResult.res.headers['x-oss-version-id'];
    });

    it('should getACL', async () => {
      try {
        const result = await store.getACL(name, {
          versionId
        });
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('getSymlink()', () => {
    const name = `${prefix}-multiversion-symlink-file.js`;
    const targetName = '/oss/target-测试.js';
    let versionId;
    let result;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
    });

    it('should getSymlink', async () => {
      try {
        await store.put(targetName.replace('测试', '测试1'), __filename);
        result = await store.putSymlink(name, targetName.replace('测试', '测试1'));
        versionId = result.res.headers['x-oss-version-id'];
        await store.put(targetName.replace('测试', '测试2'), __filename);
        await store.putSymlink(name, targetName.replace('测试', '测试2'));

        result = await store.getSymlink(name, {
          versionId
        });
        assert.strictEqual(result.res.status, 200);
      } catch (error) {
        assert(false);
      }
    });
  });

  describe('get()', () => {
    const name = `${prefix}ali-sdk/oss/get-multiversion.js`;
    let putResult;
    let versionId;
    let delVersionId;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      putResult = await store.put(name, __filename);
      const delres = await store.delete(name); // 删除当前版本，当前版本直接变为历史版本并且生成删除标记
      delVersionId = delres.res.headers['x-oss-version-id'];
      versionId = putResult.res.headers['x-oss-version-id'];
    });

    // 指定版本, 且该版本不为删除标记
    it('should get with versionId', async () => {
      const res = await store.get(name, {
        versionId
      });
      assert.strictEqual(res.res.status, 200);
    });

    // // 指定版本, 且该版本为删除标记
    it('should throw error when version is deleter marker', async () => {
      try {
        await store.get(name, {
          versionId: delVersionId
        });
        assert(false);
      } catch (error) {
        assert.strictEqual(error.status, 405);
      }
    });

    // 不指定版本,且当前版本为删除标记
    it('should throw error, when no versionId and current version is deleter marker', async () => {
      try {
        await store.get(name);
        assert(false);
      } catch (error) {
        assert.strictEqual(error.status, 404);
      }
    });

    // 不指定版本,且当前版本不为删除标记
    it('should get latest object, when no versionId and current version is object', async () => {
      const content = 'current version';
      await store.put(name, Buffer.from(content));
      const result = await store.get(name);
      assert.strictEqual(result.content.toString(), content);
    });
  });

  describe('delete()', () => {
    const name = `${prefix}ali-sdk/oss/delete-multiversion.js`;
    let versionId;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      await store.put(name, __filename);
    });

    // 不指定version id，删除当前版本，生成DELETE标记
    it('should delete object without versionId', async () => {
      await utils.sleep(ms(metaSyncTime));
      const res = await store.delete(name);
      assert.strictEqual(res.res.headers['x-oss-delete-marker'], 'true');
      assert(res.res.headers['x-oss-version-id']);
    });

    // 指定version id，删除指定版本
    it('should delete object with versionId', async () => {
      const result = await store.put(name, __filename);
      versionId = result.res.headers['x-oss-version-id'];
      const res = await store.delete(name, {
        versionId
      });
      assert.strictEqual(res.res.headers['x-oss-version-id'], versionId);
    });

    // 指定versionId，删除DELETE标记恢复上一个版本
    it('should delete marker with versionId and restore lastest marker or object', async () => {
      const result = await store.put(name, __filename);
      // 版本versionId
      versionId = result.res.headers['x-oss-version-id'];
      // 删除版本
      const res = await store.delete(name);
      // 标记versionId
      const markerVersionId = res.res.headers['x-oss-version-id'];
      // 删除标记
      await store.delete(name, {
        versionId: markerVersionId
      });
      const headInfo = await store.head(name);
      assert.strictEqual(headInfo.res.headers['x-oss-version-id'], versionId);
    });

    // 暂停多版本后，删除当前版本，当前版本不为null，为其生成一份历史版本，生成DELETE标记
    it('should delete, generate a historical version and generate a delete marker when suspended and current versionId not null', async () => {
      await store.putBucketVersioning(bucket, enabled);
      const currentName = `${name}suspended-delete`;
      const result = await store.put(currentName, Buffer.from('suspended-delete'));
      assert(result.res.headers['x-oss-version-id'] !== 'null');
      await store.putBucketVersioning(bucket, suspended);
      // 删除当前版本
      const deleteRes = await store.delete(currentName);
      assert.strictEqual(deleteRes.res.status, 204);
      // 验证产生历史版本和删除标记
      const list = await store.getBucketVersions();
      assert(list.deleteMarker.find(v => v.name === currentName));
      assert(list.objects.find(v => v.name === currentName));
    });

    // 暂停多版本后，删除当前版本，当前版本为null version，则直接删除，并生成DELETE标记
    it('should delete, generate a delete marker when suspended and current version is null', async () => {
      await store.putBucketVersioning(bucket, enabled);
      const currentName = 'version-null';
      await store.putBucketVersioning(bucket, suspended);
      // 删除当前版本
      const deleteRes = await store.delete(currentName); // 相当于指定版本删除
      assert.strictEqual(deleteRes.res.status, 204);
      // 验证未产生历史版本和产生删除标记
      const list = await store.getBucketVersions();
      assert(list.deleteMarker.find(v => v.name === currentName));
      assert(!list.objects.find(v => v.name === currentName));
    });

    // 暂停多版本后，当前版本为DELETE标记，指定version删除该DELETE标记（包括null version），则恢复上一个版本
    it('should delete marker and restore lastest version when suspended ', async () => {
      await store.putBucketVersioning(bucket, enabled);
      try {
        const currentName = 'delete-marker-test';
        const result = await store.put(currentName, Buffer.from(currentName));
        const currentVersionId = result.res.headers['x-oss-version-id'];
        // 删除当前版本 产生标记
        const delRes = await store.delete(currentName);
        const delVerionsId = delRes.res.headers['x-oss-version-id'];
        await store.putBucketVersioning(bucket, suspended);
        // 删除标记
        await store.delete(currentName, {
          versionId: delVerionsId
        });
        // 验证是否恢复上一个版本
        const headInfo = await store.head(currentName);
        assert.strictEqual(headInfo.res.headers['x-oss-version-id'], currentVersionId);
      } catch (error) {
        assert(false, error.message);
      }
    });
  });

  describe('getBucketInfo()', () => {
    it('should return bucket Versioning', async () => {
      try {
        await store.putBucketVersioning(bucket, enabled,);
        const result = await store.getBucketInfo(bucket);
        assert.equal(result.res.status, 200);
        assert.equal(result.bucket.Versioning, enabled);
      } catch (error) {
        assert(false, error.message);
      }
    });
  });

  describe('getObjectTagging(), putObjectTagging(), deleteObjectTagging()', () => {
    const name = `${prefix}-multiversion-tagging-file.js`;
    let putResult;
    let versionId;
    let versionOpt;

    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      putResult = await store.put(name, __filename);
      await store.delete(name);
      versionId = putResult.res.headers['x-oss-version-id'];
      versionOpt = {
        versionId
      };
    });

    it('should get the tags of object', async () => {
      try {
        const result = await store.getObjectTagging(name, versionOpt);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });

    it('should configures or updates the tags of object', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        result = await store.putObjectTagging(name, tag, versionOpt);
        assert.strictEqual(result.status, 200);

        result = await store.getObjectTagging(name, versionOpt);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, tag);
      } catch (error) {
        assert(false, error);
      }
    });

    it('should delete the tags of object', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        await store.putObjectTagging(name, tag, versionOpt);

        result = await store.deleteObjectTagging(name, versionOpt);
        assert.strictEqual(result.status, 204);

        result = await store.getObjectTagging(name, versionOpt);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });
  });

  describe('getObjectMeta()', () => {
    let name;
    let resHeaders;
    let fileSize;
    let opt;
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      name = `${prefix}ali-sdk/oss/object-multiversion-meta.js`;
      const object = await store.put(name, __filename);
      fileSize = fs.statSync(__filename).size;
      resHeaders = object.res.headers;
      // 删除当前版本，创建历史版本
      await store.delete(name);
      opt = {
        versionId: object.res.headers['x-oss-version-id']
      };
    });

    it('should return Etag and Content-Length', async () => {
      try {
        const info = await store.getObjectMeta(name, opt);
        assert.equal(info.status, 200);
        assert.equal(info.res.headers.etag, resHeaders.etag);
        assert.equal(info.res.headers['content-length'], fileSize);
      } catch (error) {
        assert(false, error.message);
      }
    });
  });

  describe('deleteMulti()', () => {
    const names = [];
    const versionIds = [];
    beforeEach(async () => {
      await store.putBucketVersioning(bucket, enabled);
      let name = `${prefix}ali-sdk/oss/deleteMulti0.js`;
      let result;
      result = await store.put(name, __filename);
      versionIds.push(result.res.headers['x-oss-version-id']);
      names.push(name);

      name = `${prefix}ali-sdk/oss/deleteMulti1.js`;
      result = await store.put(name, __filename);
      versionIds.push(result.res.headers['x-oss-version-id']);
      names.push(name);

      name = `${prefix}ali-sdk/oss/deleteMulti2.js`;
      result = await store.put(name, __filename);
      versionIds.push(result.res.headers['x-oss-version-id']);
      names.push(name);
    });

    it('should delete', async () => {
      try {
        // 不指定版本 批量删除,产生历史版本和删除标记
        let result;
        result = await store.deleteMulti(names);
        const markerVersionId = result.deleted.map(v => v.DeleteMarkerVersionId);
        assert.strictEqual(result.res.status, 200);
        assert.strictEqual(result.deleted.map(v => v.Key).sort().toString(), names.sort().toString());
        assert.strictEqual(result.deleted.filter(v => v.DeleteMarker).length, result.deleted.length);

        // 指定版本 批量删除历史版本文件，永久删除
        const delNameObjArr = names.map((_, index) => ({
          key: _,
          versionId: versionIds[index]
        }));
        result = await store.deleteMulti(delNameObjArr);
        assert.strictEqual(result.res.status, 200);
        assert.strictEqual(result.deleted.map(v => v.Key).sort().toString(), names.sort().toString());

        // 指定版本 批量删除标记
        const delNameMarkerArr = names.map((_, index) => ({
          key: _,
          versionId: markerVersionId[index]
        }));
        result = await store.deleteMulti(delNameMarkerArr);
        assert.strictEqual(result.res.status, 200);
        assert.strictEqual(result.deleted.map(v => v.Key).sort().toString(), names.sort().toString());
        assert.strictEqual(result.deleted.filter(v => v.DeleteMarker).length, result.deleted.length);
      } catch (error) {
        assert(false, error.message);
      }
    });
  });

  describe('uploadPartCopy()', () => {
    let fileName;
    let sourceName;
    let versionId;
    before(async () => {
      await store.putBucketVersioning(bucket, enabled);
      fileName = await utils.createTempFile(
        'multipart-upload-file-copy',
        2 * 1024 * 1024
      );
      sourceName = `${prefix}multipart/upload-file-with-copy`;
      const res = await store.multipartUpload(sourceName, fileName);
      // versionId
      versionId = res.res.headers['x-oss-version-id'];
      // 删除当前版本
      await store.delete(sourceName);
    });

    it('should copy with upload part copy', async () => {
      const copyName = `${prefix}multipart/upload-file-with-copy-new`;
      const sourceData = {
        sourceKey: sourceName,
        sourceBucketName: bucket
      };
      const objectMeta = await store._getObjectMeta(
        sourceData.sourceBucketName,
        sourceData.sourceKey,
        {
          versionId
        }
      );
      const fileSize = objectMeta.res.headers['content-length'];

      const result = await store.initMultipartUpload(copyName);

      const partSize = 100 * 1024; // 100kb
      const dones = [];

      const uploadFn = async (i) => {
        const start = partSize * (i - 1);
        const end = Math.min(start + partSize, fileSize);
        const range = `${start}-${end - 1}`;
        const part = await store.uploadPartCopy(
          copyName,
          result.uploadId,
          i,
          range,
          sourceData,
          { versionId }
        );
        dones.push({
          number: i,
          etag: part.res.headers.etag
        });
      };
      await Promise.all(Array(10).fill(1).map((v, i) => uploadFn(i + 1)));

      const complete = await store.completeMultipartUpload(
        copyName,
        result.uploadId,
        dones
      );

      assert.equal(complete.res.status, 200);
    });
  });
});
