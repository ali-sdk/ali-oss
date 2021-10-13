/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */

const assert = require('assert');
const utils = require('./utils');
const oss = require('../..');
const config = require('../config').oss;
const ms = require('humanize-ms');
const { metaSyncTime } = require('../config');

// only run on travis ci

// if (!process.env.CI) {
//   return;
// }

describe('test/bucket.test.js', () => {
  const { prefix, includesConf } = utils;
  let store;
  let bucket;
  let bucketRegion;
  const defaultRegion = config.region;
  before(async () => {
    store = oss(config);
    config.region = defaultRegion;
    store = oss(config);
    bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    bucketRegion = defaultRegion;

    const result = await store.putBucket(bucket, { timeout: process.env.ONCI ? 60000 : 10000 });
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);
  });
  after(async () => {
    await utils.cleanAllBucket(store);
  });

  describe('setBucket()', () => {
    it('should check bucket name', async () => {
      try {
        const name = 'ali-oss-test-bucket-/';
        await store.setBucket(name);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The bucket must be conform to the specifications');
      }
    });
  });

  describe('getBucket()', () => {
    it('should get bucket name', async () => {
      const name = 'ali-oss-test-bucket';
      await store.setBucket(name);
      const res = store.getBucket();
      assert.equal(res, name);
    });
  });

  describe('putBucket()', () => {
    let name;
    let archvieBucket;
    before(async () => {
      name = `ali-oss-test-putbucket-${prefix.replace(/[/.]/g, '-')}`;
      name = name.substring(0, name.length - 1);
      // just for archive bucket test
      archvieBucket = `ali-oss-archive-bucket-${prefix.replace(/[/.]/g, '-')}`;
      archvieBucket = archvieBucket.substring(0, archvieBucket.length - 1);
      await store.putBucket(archvieBucket, { StorageClass: 'Archive', timeout: 120000 });
    });

    it('should create a new bucket', async () => {
      const result1 = await store.putBucket(name, { timeout: 120000 });
      assert.equal(result1.bucket, name);
      assert.equal(result1.res.status, 200);
    });

    it('should create an archive bucket', async () => {
      await utils.sleep(ms(metaSyncTime));
      const result2 = await store.listBuckets({}, {
        timeout: 120000,
      });
      const { buckets } = result2;
      const m = buckets.some(item => item.name === archvieBucket);
      assert(m === true);
      buckets.map((item) => {
        if (item.name === archvieBucket) {
          assert(item.StorageClass === 'Archive');
        }
        return 1;
      });
    });

    // todo resume
    // it('should create an ZRS bucket', async () => {
    //   const ZRS_name = `ali-oss-zrs-${prefix.replace(/[/.]/g, '-').slice(0, -1)}`;
    //   const ZRS_put_res = await store.putBucket(ZRS_name, {
    //     dataRedundancyType: 'ZRS'
    //   });
    //   assert.strictEqual(ZRS_put_res.res.status, 200);
    //   const ZRS_get_res = await store.getBucketInfo(ZRS_name);
    //   assert.strictEqual(ZRS_get_res.bucket.DataRedundancyType, 'ZRS');
    //   await store.deleteBucket(ZRS_name);
    // });

    it('should create an public-read bucket', async () => {
      const public_read_name = `ali-oss-zrs-${prefix.replace(/[/.]/g, '-').slice(0, -1)}`;
      const public_read_name_res = await store.putBucket(public_read_name, {
        acl: 'public-read'
      });
      assert.strictEqual(public_read_name_res.res.status, 200);
      const public_read_name_get_res = await store.getBucketInfo(public_read_name);
      assert.strictEqual(public_read_name_get_res.bucket.AccessControlList.Grant, 'public-read');
      await store.deleteBucket(public_read_name);
    });

    after(async () => {
      const result = await store.deleteBucket(name);
      assert(result.res.status === 200 || result.res.status === 204);
      await store.deleteBucket(archvieBucket);
    });
  });

  describe('getBucketInfo', () => {
    it('it should return correct bucketInfo when bucket exist', async () => {
      const result = await store.getBucketInfo(bucket);
      assert.equal(result.res.status, 200);

      assert.equal(result.bucket.Location, `${bucketRegion}`);
      assert.equal(result.bucket.ExtranetEndpoint, `${bucketRegion}.aliyuncs.com`);
      assert.equal(result.bucket.IntranetEndpoint, `${bucketRegion}-internal.aliyuncs.com`);
      assert.equal(result.bucket.AccessControlList.Grant, 'private');
      assert.equal(result.bucket.StorageClass, 'Standard');
    });

    it('it should return NoSuchBucketError when bucket not exist', async () => {
      await utils.throws(async () => {
        await store.getBucketInfo('not-exists-bucket');
      }, 'NoSuchBucketError');
    });
  });

  describe('getBucketLoaction', () => {
    it('it should return loaction this.region', async () => {
      const result = await store.getBucketLocation(bucket);
      assert.equal(result.location, bucketRegion);
    });

    it('it should return NoSuchBucketError when bucket not exist', async () => {
      await utils.throws(async () => {
        await store.getBucketLocation('not-exists-bucket');
      }, 'NoSuchBucketError');
    });
  });

  describe('deleteBucket()', () => {
    it('should delete not exists bucket throw NoSuchBucketError', async () => {
      await utils.throws(async () => {
        await store.deleteBucket('not-exists-bucket');
      }, 'NoSuchBucketError');
    });

    it('should delete not empty bucket throw BucketNotEmptyError', async () => {
      store.useBucket(bucket);
      await store.put('ali-oss-test-bucket.txt', __filename);
      utils.sleep(ms(metaSyncTime));
      await utils.throws(async () => {
        await store.deleteBucket(bucket);
      }, 'BucketNotEmptyError');
      await store.delete('ali-oss-test-bucket.txt');
    });
  });

  describe('putBucketACL()', () => {
    it('should set bucket acl to public-read-write', async () => {
      const resultAcl = await store.putBucketACL(bucket, 'public-read-write');
      assert.equal(resultAcl.res.status, 200);
      assert.equal(resultAcl.bucket, bucket);

      // Need wait some time for bucket meta sync
      await utils.sleep(ms(metaSyncTime));

      const r = await store.getBucketACL(bucket);
      assert.equal(r.res.status, 200);
      // skip it, data will be delay
      // assert.equal(r.acl, 'public-read-write');
    });

    it('should create and set acl when bucket not exists', async () => {
      const bucketacl = `${bucket}-new`;
      const putresult = await store.putBucketACL(bucketacl, 'public-read');
      assert.equal(putresult.res.status, 200);
      assert.equal(putresult.bucket, bucketacl);

      await utils.sleep(ms(metaSyncTime));

      const getresult = await store.getBucketACL(bucketacl);
      assert.equal(getresult.res.status, 200);
      assert.equal(getresult.acl, 'public-read');

      await store.deleteBucket(bucketacl);
    });
  });

  describe('listBuckets()', () => {
    let listBucketsPrefix;
    before(async () => {
      // create 2 buckets
      listBucketsPrefix = `ali-oss-list-buckets-${prefix.replace(/[/.]/g, '-')}`;
      await Promise.all(Array(2).fill(1).map((v, i) => store.putBucket(listBucketsPrefix + i)));
    });

    it('should list buckets by prefix', async () => {
      const result = await store.listBuckets({
        prefix: listBucketsPrefix,
        'max-keys': 20,
      }, {
        timeout: 120000
      });

      assert(Array.isArray(result.buckets));
      assert.equal(result.buckets.length, 2);
      assert(!result.isTruncated);
      assert.equal(result.nextMarker, null);
      assert(result.owner);
      assert.equal(typeof result.owner.id, 'string');
      assert.equal(typeof result.owner.displayName, 'string');

      for (let i = 0; i < 2; i++) {
        const name = listBucketsPrefix + i;
        assert.equal(result.buckets[i].name, name);
      }
    });

    it('should list buckets by subres', async () => {
      const tag = {
        a: '1',
        b: '2'
      };
      const putTagBukcet = `${listBucketsPrefix}0`;
      await store.putBucketTags(putTagBukcet, tag);
      const { buckets } = await store.listBuckets({
        prefix: listBucketsPrefix,
        subres: {
          tagging: Object.entries(tag).map(_ => _.map(inner => `"${inner.toString()}"`).join(':')).join(',')
        }
      });

      if (buckets && buckets.length && buckets[0]) {
        assert.deepStrictEqual(buckets[0].tag, tag);
      } else {
        assert(false);
      }
    });

    after(async () => {
      await Promise.all(Array(2).fill(1).map((v, i) => store.deleteBucket(listBucketsPrefix + i)));
    });
  });

  describe('putBucketLogging(), getBucketLogging(), deleteBucketLogging()', () => {
    it('should create, get and delete the logging', async () => {
      let result = await store.putBucketLogging(bucket, 'logs/');
      assert.equal(result.res.status, 200);
      // put again will be fine
      result = await store.putBucketLogging(bucket, 'logs/');
      assert.equal(result.res.status, 200);

      // get the logging setttings
      result = await store.getBucketLogging(bucket);
      assert.equal(result.res.status, 200);

      // delete it
      result = await store.deleteBucketLogging(bucket);
      assert.equal(result.res.status, 204);
    });
  });

  describe('putBucketWebsite(), getBucketWebsite(), deleteBucketWebsite()', () => {
    it('should get and delete the website settings', async () => {
      await store.putBucketWebsite(bucket, {
        index: 'index.html'
      });

      await utils.sleep(ms(metaSyncTime));

      // get
      const get = await store.getBucketWebsite(bucket);
      assert.equal(typeof get.index, 'string');
      assert.equal(get.res.status, 200);

      // delete it
      const del = await store.deleteBucketWebsite(bucket);
      assert.equal(del.res.status, 204);
    });

    it('should create when RoutingRules is Array or Object', async () => {
      const routingRule1 = {
        RuleNumber: '1',
        Condition: {
          KeyPrefixEquals: 'abc/',
          HttpErrorCodeReturnedEquals: '404'
        },
        Redirect: {
          RedirectType: 'Mirror',
          MirrorUsingRole: 'false',
          MirrorUserLastModified: 'false',
          PassQueryString: 'true',
          MirrorIsExpressTunnel: 'false',
          MirrorPassOriginalSlashes: 'false',
          MirrorAllowHeadObject: 'false',
          MirrorURL: 'http://www.test.com/',
          MirrorPassQueryString: 'true',
          MirrorFollowRedirect: 'true',
          MirrorCheckMd5: 'true',
          MirrorHeaders: {
            PassAll: 'true',
            Pass: ['myheader-key1', 'myheader-key2'],
            Remove: ['remove1', 'remove2'],
            Set: {
              Key: 'myheader-key5',
              Value: 'myheader-value5'
            }
          }
        }
      };
      const routingRules = [
        {
          RuleNumber: '2',
          Condition: {
            KeyPrefixEquals: 'a1bc/',
            HttpErrorCodeReturnedEquals: '404'
          },
          Redirect: {
            RedirectType: 'Mirror',
            MirrorUsingRole: 'false',
            MirrorUserLastModified: 'false',
            MirrorAllowHeadObject: 'false',
            MirrorIsExpressTunnel: 'false',
            MirrorPassOriginalSlashes: 'false',
            PassQueryString: 'true',
            MirrorURL: 'http://www.test1.com/',
            MirrorPassQueryString: 'true',
            MirrorFollowRedirect: 'true',
            MirrorCheckMd5: 'true',
            MirrorHeaders: {
              PassAll: 'true',
              Pass: ['myheader-key12', 'myheader-key22'],
              Remove: ['remove1', 'remove2'],
              Set: {
                Key: 'myheader-key5',
                Value: 'myheader-value5'
              }
            }
          }
        }];
      const website = {
        index: 'index1.html',
        supportSubDir: 'true',
        type: '1',
        error: 'error1.html',
        routingRules
      };

      const result1 = await store.putBucketWebsite(bucket, website);
      assert.strictEqual(result1.res.status, 200);
      const rules1 = await store.getBucketWebsite(bucket);
      assert(includesConf(rules1.routingRules, routingRules));
      assert.strictEqual(rules1.supportSubDir, website.supportSubDir);
      assert.strictEqual(rules1.type, website.type);

      website.routingRules = [routingRule1];
      const result2 = await store.putBucketWebsite(bucket, website);
      assert.strictEqual(result2.res.status, 200);
      const rules2 = await store.getBucketWebsite(bucket);
      assert(includesConf(rules2.routingRules, website.routingRules));
    });

    it('should throw error when RoutingRules is not Array', async () => {
      const website = {
        index: 'index1.html',
        supportSubDir: 'true',
        type: '1',
        error: 'error1.html',
        routingRules: ''
      };

      try {
        await store.putBucketWebsite(bucket, website);
        assert(false);
      } catch (error) {
        assert.strictEqual(error.message, 'RoutingRules must be Array');
      }
      try {
        website.RoutingRules = 0;
        await store.putBucketWebsite(bucket, website);
        assert(false);
      } catch (error) {
        assert.strictEqual(error.message, 'RoutingRules must be Array');
      }
    });
  });

  describe('putBucketReferer(), getBucketReferer(), deleteBucketReferer()', () => {
    it('should create, get and delete the referer', async () => {
      const putresult = await store.putBucketReferer(bucket, true, [
        'http://npm.taobao.org'
      ], { timeout: 120000 });
      assert.equal(putresult.res.status, 200);

      // put again will be fine
      const referers = [
        'http://npm.taobao.org',
        'https://npm.taobao.org',
        'http://cnpmjs.org'
      ];
      const putReferer = await store.putBucketReferer(bucket, false, referers, { timeout: 120000 });
      assert.equal(putReferer.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      // get
      const getReferer = await store.getBucketReferer(bucket);
      assert(Array.isArray(getReferer.referers));
      assert.equal(typeof getReferer.allowEmpty, 'boolean');
      assert.equal(getReferer.res.status, 200);

      // delete it
      const deleteResult = await store.deleteBucketReferer(bucket);
      assert.equal(deleteResult.res.status, 200);
    });
  });

  describe('putBucketCORS(), getBucketCORS(), deleteBucketCORS()', () => {
    afterEach(async () => {
      // delete it
      const result = await store.deleteBucketCORS(bucket, { timeout: 120000 });
      assert.equal(result.res.status, 204);
    });

    it('should create, get and delete the cors', async () => {
      const rules = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30'
      }];
      const putResult = await store.putBucketCORS(bucket, rules);
      assert.equal(putResult.res.status, 200);

      const getResult = await store.getBucketCORS(bucket, { timeout: 120000 });
      assert.equal(getResult.res.status, 200);
      assert.deepEqual(getResult.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        allowedHeader: '*',
        exposeHeader: 'Content-Length',
        maxAgeSeconds: '30'
      }]);
    });

    it('should overwrite cors', async () => {
      const rules1 = [{
        allowedOrigin: '*',
        allowedMethod: 'GET',
        timeout: 120000
      }];
      const putCorsResult1 = await store.putBucketCORS(bucket, rules1);
      assert.equal(putCorsResult1.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      const getCorsResult1 = await store.getBucketCORS(bucket, { timeout: 120000 });
      assert.equal(getCorsResult1.res.status, 200);
      assert.deepEqual(getCorsResult1.rules, [{
        allowedOrigin: '*',
        allowedMethod: 'GET'
      }]);

      const rules2 = [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD'
      }];
      const putCorsResult2 = await store.putBucketCORS(bucket, rules2);
      assert.equal(putCorsResult2.res.status, 200);

      await utils.sleep(ms(metaSyncTime));

      const getCorsResult2 = await store.getBucketCORS(bucket, { timeout: 120000 });
      assert.equal(getCorsResult2.res.status, 200);
      assert.deepEqual(getCorsResult2.rules, [{
        allowedOrigin: 'localhost',
        allowedMethod: 'HEAD'
      }]);
    });

    it('should check rules', async () => {
      try {
        await store.putBucketCORS(bucket);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'rules is required');
      }
    });

    it('should check allowedOrigin', async () => {
      try {
        await store.putBucketCORS(bucket, [{}]);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedOrigin is required');
      }
    });

    it('should check allowedMethod', async () => {
      try {
        const rules = [{
          allowedOrigin: '*'
        }];
        await store.putBucketCORS(bucket, rules);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'allowedMethod is required');
      }
    });

    it('should throw error when rules not exist', async () => {
      try {
        await store.getBucketCORS(bucket);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'The CORS Configuration does not exist.');
      }
    });
  });

  describe('putBucketRequestPayment(), getBucketRequestPayment()', () => {
    it('should create, get the request payment', async () => {
      try {
        await store.putBucketRequestPayment(bucket, 'Requester');
        const result = await store.getBucketRequestPayment(bucket);
        assert(result.payer === 'Requester', 'payer should be Requester');
      } catch (err) {
        assert(false);
      }
    });

    it('should throw error when payer is not BucketOwner or Requester', async () => {
      try {
        await store.putBucketRequestPayment(bucket, 'requester');
      } catch (err) {
        assert(err.message.includes('payer must be BucketOwner or Requester'));
      }
    });
  });

  describe('getBucketTags() putBucketTags() deleteBucketTags()', () => {
    it('should get the tags of bucket', async () => {
      try {
        const result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });

    it('should configures or updates the tags of bucket', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        result = await store.putBucketTags(bucket, tag);
        assert.strictEqual(result.status, 200);

        result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, tag);
      } catch (error) {
        assert(false, error);
      }

      try {
        const tag = { a: '1' };
        result = await store.putBucketTags(bucket, tag);
        assert.strictEqual(result.status, 200);

        result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, tag);
      } catch (error) {
        assert(false, error);
      }
    });

    it('maximum of 20 tags for a bucket', async () => {
      try {
        const tag = {};
        Array(21).fill(1).forEach((_, index) => {
          tag[index] = index;
        });
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('maximum of 20 tags for a bucket', error.message);
      }
    });

    it('tag key can be a maximum of 64 bytes in length', async () => {
      try {
        const key = new Array(65).fill('1').join('');
        const tag = { [key]: '1' };

        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('tag key can be a maximum of 64 bytes in length', error.message);
      }
    });

    it('tag value can be a maximum of 128 bytes in length', async () => {
      try {
        const value = new Array(129).fill('1').join('');
        const tag = { a: value };

        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('tag value can be a maximum of 128 bytes in length', error.message);
      }
    });

    it('should throw error when the type of tag is not Object', async () => {
      try {
        const tag = [{ a: 1 }];
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert(error.message.includes('tag must be Object'));
      }
    });

    it('should throw error when the type of tag value is number', async () => {
      try {
        const tag = { a: 1 };
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should throw error when the type of tag value is Object', async () => {
      try {
        const tag = { a: { inner: '1' } };
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should throw error when the type of tag value is Array', async () => {
      try {
        const tag = { a: ['1', '2'] };
        await store.putBucketTags(bucket, tag);
      } catch (error) {
        assert.strictEqual('the key and value of the tag must be String', error.message);
      }
    });

    it('should delete the tags of bucket', async () => {
      let result;
      try {
        const tag = { a: '1', b: '2' };
        await store.putBucketTags(bucket, tag);

        result = await store.deleteBucketTags(bucket);
        assert.strictEqual(result.status, 204);

        result = await store.getBucketTags(bucket);
        assert.strictEqual(result.status, 200);
        assert.deepEqual(result.tag, {});
      } catch (error) {
        assert(false, error);
      }
    });
  });

  describe('putBucketEncryption(), getBucketEncryption(), deleteBucketEncryption()', () => {
    it('should create, get and delete the bucket encryption', async () => {
      // put with AES256
      const putresult1 = await store.putBucketEncryption(bucket, {
        SSEAlgorithm: 'AES256'
      });
      assert.equal(putresult1.res.status, 200);
      // put again with KMS will be fine
      // const putresult2 = await store.putBucketEncryption(bucket, {
      //   SSEAlgorithm: 'KMS',
      //   KMSMasterKeyID: '1b2c3132-b2ce-4ba3-a4dd-9885904099ad'
      // });
      // assert.equal(putresult2.res.status, 200);
      // await utils.sleep(ms(metaSyncTime));
      // get
      const getBucketEncryption = await store.getBucketEncryption(bucket);
      assert.equal(getBucketEncryption.res.status, 200);
      assert.deepEqual(getBucketEncryption.encryption, {
        SSEAlgorithm: 'AES256'
        // KMSMasterKeyID: '1b2c3132-b2ce-4ba3-a4dd-9885904099ad'
      });
      // delete
      const deleteResult = await store.deleteBucketEncryption(bucket);
      assert.equal(deleteResult.res.status, 204);
    });
  });

  describe('putBucketLifecycle()', () => {
    // todo delete
    it('should put the lifecycle with old api', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'expiration1',
        prefix: 'logs/',
        status: 'Enabled',
        days: 1
      }]);
      assert.equal(putresult1.res.status, 200);

      const putresult2 = await store.putBucketLifecycle(bucket, [{
        id: 'expiration2',
        prefix: 'logs/',
        status: 'Enabled',
        date: '2020-02-18T00:00:00.000Z'
      }]);
      assert.equal(putresult2.res.status, 200);
    });

    it('should put the lifecycle with expiration and id', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'expiration1',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          days: 1
        }
      }]);
      assert.equal(putresult1.res.status, 200);

      const getBucketLifecycle = await store.getBucketLifecycle(bucket);
      assert(getBucketLifecycle.rules.length > 0 && getBucketLifecycle.rules.find(v => v.id === 'expiration1'));

      const putresult2 = await store.putBucketLifecycle(bucket, [{
        id: 'expiration2',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          createdBeforeDate: '2020-02-18T00:00:00.000Z'
        }
      }]);
      assert.equal(putresult2.res.status, 200);
    });

    it('should put the lifecycle with AbortMultipartUpload', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'abortMultipartUpload1',
        prefix: 'logs/',
        status: 'Enabled',
        abortMultipartUpload: {
          days: 1
        }
      }]);
      assert.equal(putresult1.res.status, 200);

      const putresult2 = await store.putBucketLifecycle(bucket, [{
        id: 'abortMultipartUpload2',
        prefix: 'logs/',
        status: 'Enabled',
        abortMultipartUpload: {
          createdBeforeDate: '2020-02-18T00:00:00.000Z'
        }
      }]);
      assert.equal(putresult2.res.status, 200);
    });

    it('should put the lifecycle with empty prefix (whole bucket)', async () => {
      const putresult = await store.putBucketLifecycle(bucket, [{
        id: 'abortMultipartUpload1',
        prefix: '', // empty prefix (whole bucket)
        status: 'Enabled',
        abortMultipartUpload: {
          days: 1
        }
      }]);
      assert.equal(putresult.res.status, 200);
    });

    it('should put the lifecycle with Transition', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'transition',
        prefix: 'logs/',
        status: 'Enabled',
        transition: {
          createdBeforeDate: '2020-02-18T00:00:00.000Z',
          storageClass: 'Archive'
        },
        expiration: {
          createdBeforeDate: '2020-02-17T00:00:00.000Z'
        },
        tag: {
          key: 'test',
          value: '123'
        }
      }]);
      assert.equal(putresult1.res.status, 200);

      const putresult2 = await store.putBucketLifecycle(bucket, [{
        id: 'transition',
        prefix: 'logs/',
        status: 'Enabled',
        transition: {
          days: 20,
          storageClass: 'Archive'
        },
        tag: {
          key: 'test',
          value: '123'
        }
      }]);
      assert.equal(putresult2.res.status, 200);
    });

    it('should put the lifecycle with expiration and Tag', async () => {
      const putresult1 = await store.putBucketLifecycle(bucket, [{
        id: 'tag1',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          days: 1
        },
        tag: {
          key: 1,
          value: '2'
        }
      }]);
      assert.equal(putresult1.res.status, 200);

      const putresult2 = await store.putBucketLifecycle(bucket, [{
        id: 'tag2',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          createdBeforeDate: '2020-02-18T00:00:00.000Z'
        },
        tag: {
          key: 1,
          value: '2'
        }
      }]);
      assert.equal(putresult2.res.status, 200);

      const putresult3 = await store.putBucketLifecycle(bucket, [{
        id: 'tag2',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          createdBeforeDate: '2020-02-18T00:00:00.000Z'
        },
        tag: [{
          key: 1,
          value: '2'
        }, {
          key: 'testkey',
          value: 'testvalue'
        }]
      }]);
      assert.equal(putresult3.res.status, 200);
    });

    it('should throw error when id more than 255 bytes ', async () => {
      const testID = Array(256).fill('a').join('');
      try {
        await store.putBucketLifecycle(bucket, [{
          id: testID,
          prefix: 'testid/',
          status: 'Enabled'
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('255'));
      }
    });

    it('should throw error when no prefix', async () => {
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'prefix',
          status: 'Enabled'
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('prefix'));
      }
    });

    it('should throw error when status is not Enabled or Disabled', async () => {
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'status',
          prefix: 'fix/',
          status: 'test'
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('Enabled or Disabled'));
      }
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'status',
          prefix: 'fix/',
          status: ''
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('Enabled or Disabled'));
      }
    });

    it('should throw error when storageClass is not Archive or IA', async () => {
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'storageClass',
          prefix: 'fix/',
          status: 'Enabled',
          transition: {
            createdBeforeDate: '2020-02-18T00:00:00.000Z',
            storageClass: 'test'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('IA or Archive'));
      }
    });

    it('should throw error when transition must have days or createdBeforeDate', async () => {
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'storageClass',
          prefix: 'fix/',
          status: 'Enabled',
          transition: {
            storageClass: 'Archive'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('days or createdBeforeDate'));
      }
    });

    it('should throw error when days of transition is not a positive integer', async () => {
      const errorMessage = 'a positive integer';
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'transition',
          prefix: 'fix/',
          status: 'Enabled',
          transition: {
            days: 1.1,
            storageClass: 'Archive'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }

      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'transition',
          prefix: 'fix/',
          status: 'Enabled',
          transition: {
            days: 'asd',
            storageClass: 'Archive'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }
    });

    it('should throw error when createdBeforeDate of transition is not iso8601 format', async () => {
      const errorMessage = 'iso8601';
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'transition',
          prefix: 'fix/',
          status: 'Enabled',
          transition: {
            createdBeforeDate: new Date().toISOString(), // eg: YYYY-MM-DDT00:00:00.000Z
            storageClass: 'Archive'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }

      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'transition',
          prefix: 'fix/',
          status: 'Enabled',
          transition: {
            createdBeforeDate: new Date().toString(),
            storageClass: 'Archive'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }
    });

    it('should throw error when abortMultipartUpload must have days or createdBeforeDate', async () => {
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'storageClass',
          prefix: 'fix/',
          status: 'Enabled',
          abortMultipartUpload: {}
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes('days or createdBeforeDate'));
      }
    });

    it('should throw error when days of abortMultipartUpload is not a positive integer', async () => {
      const errorMessage = 'a positive integer';
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'abortMultipartUpload',
          prefix: 'fix/',
          status: 'Enabled',
          abortMultipartUpload: {
            days: 1.1
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }

      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'abortMultipartUpload',
          prefix: 'fix/',
          status: 'Enabled',
          abortMultipartUpload: {
            days: 'a'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }
    });

    it('should throw error when createdBeforeDate of abortMultipartUpload is not iso8601 format', async () => {
      const errorMessage = 'iso8601';
      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'abortMultipartUpload',
          prefix: 'fix/',
          status: 'Enabled',
          abortMultipartUpload: {
            createdBeforeDate: new Date().toISOString() // eg: YYYY-MM-DDT00:00:00.000Z
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }

      try {
        await store.putBucketLifecycle(bucket, [{
          id: 'abortMultipartUpload',
          prefix: 'fix/',
          status: 'Enabled',
          abortMultipartUpload: {
            createdBeforeDate: new Date().toString() // eg: YYYY-MM-DDT00:00:00.000Z
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }
    });

    it('should throw error when rule have no expiration or abortMultipartUpload', async () => {
      const errorMessage = 'expiration or abortMultipartUpload';
      try {
        await store.putBucketLifecycle(bucket, [{
          prefix: 'expirationAndAbortMultipartUpload/',
          status: 'Enabled'
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }
    });

    it('should throw error when tag is used with abortMultipartUpload', async () => {
      const errorMessage = 'Tag cannot be used with abortMultipartUpload';
      try {
        await store.putBucketLifecycle(bucket, [{
          prefix: 'expirationAndAbortMultipartUpload/',
          status: 'Enabled',
          abortMultipartUpload: {
            days: 1
          },
          expiration: {
            days: 1
          },
          tag: {
            value: '1',
            key: 'test'
          }
        }]);
        assert(false);
      } catch (error) {
        assert(error.message.includes(errorMessage));
      }
    });
  });

  describe('getBucketLifecycle()', () => {
    it('should get the lifecycle', async () => {
      const putresult = await store.putBucketLifecycle(bucket, [{
        id: 'get_test',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          days: 1
        },
        tag: [{
          key: 'test',
          value: '1'
        },
        {
          key: 'test1',
          value: '2'
        }]
      }]);
      assert.equal(putresult.res.status, 200);

      const getBucketLifecycle = await store.getBucketLifecycle(bucket);
      assert(getBucketLifecycle.rules.length > 0);
      assert.equal(getBucketLifecycle.res.status, 200);
    });
  });

  describe('deleteBucketLifecycle()', () => {
    it('should delete the lifecycle', async () => {
      const putresult = await store.putBucketLifecycle(bucket, [{
        id: 'delete',
        prefix: 'logs/',
        status: 'Enabled',
        expiration: {
          days: 1
        },
        tag: [{
          key: 'test',
          value: '1'
        },
        {
          key: 'test1',
          value: '2'
        }]
      }]);
      assert.equal(putresult.res.status, 200);

      // delete it
      const deleteResult = await store.deleteBucketLifecycle(bucket);
      assert.equal(deleteResult.res.status, 204);
    });
  });

  describe('getBucketPolicy() putBucketPolicy() deleteBucketPolicy()', () => {
    it('should put, get, delete, when policy is Object', async () => {
      try {
        const policy = {
          Version: '1',
          Statement: [
            {
              Action: ['oss:PutObject', 'oss:GetObject'],
              Effect: 'Deny',
              Principal: ['1234567890'],
              Resource: ['acs:oss:*:1234567890:*/*']
            }
          ]
        };
        const result = await store.putBucketPolicy(bucket, policy);
        assert.strictEqual(result.status, 200);
        const result1 = await store.getBucketPolicy(bucket);
        assert.deepStrictEqual(policy, result1.policy);
        const result2 = await store.deleteBucketPolicy(bucket);
        assert.strictEqual(result2.status, 204);
        const result3 = await store.getBucketPolicy(bucket);
        assert.deepStrictEqual(null, result3.policy);
      } catch (err) {
        assert(false, err.message);
      }
    });
    it('should throw error, when policy is not Object', async () => {
      try {
        await store.putBucketPolicy(bucket, 'policy');
        assert(false);
      } catch (err) {
        assert(true);
      }
    });
  });
  describe('inventory()', () => {
    const inventory = {
      id: 'default',
      isEnabled: false,
      prefix: 'ttt',
      OSSBucketDestination: {
        format: 'CSV',
        accountId: '1817184078010220',
        rolename: 'AliyunOSSRole',
        bucket,
        prefix: 'test',
      },
      frequency: 'Daily',
      includedObjectVersions: 'All',
      optionalFields: {
        field: ['Size', 'LastModifiedDate'],
      },
    };

    describe('putBucketInventory', () => {
      before(() => {
        inventory.OSSBucketDestination.bucket = bucket;
      });
      it('should put bucket inventory', async () => {
        try {
          await store.putBucketInventory(bucket, inventory);
        } catch (err) {
          assert(false, err);
        }
      });
      it('should return inventory array when inventory is one config', async () => {
        const inventoryRes = await store.listBucketInventory(bucket);
        assert(Array.isArray(inventoryRes.inventoryList));
        assert(inventoryRes.inventoryList.length === 1);
        assert.strictEqual(inventoryRes.status, 200);
      });
      it('should put bucket inventory when no optionalFields or no field', async () => {
        try {
          inventory.id = 'test_optionalFields';
          delete inventory.optionalFields;
          await store.putBucketInventory(bucket, inventory);

          inventory.id = 'test_field';
          inventory.optionalFields = {};
          await store.putBucketInventory(bucket, inventory);

          inventory.id = 'test_field_is_one';
          inventory.optionalFields = {
            field: ['Size'],
          };
          await store.putBucketInventory(bucket, inventory);
          assert(true);
        } catch (err) {
          assert(false, err);
        }
      });
      it('should put bucket inventory when no prefix', async () => {
        try {
          inventory.id = 'test_prefix';
          delete inventory.prefix;
          await store.putBucketInventory(bucket, inventory);
          assert(true);
        } catch (err) {
          assert(false, err);
        }
      });
      it('should put bucket inventory when no OSSBucketDestination prefix', async () => {
        try {
          inventory.id = 'test_OSSBucketDestination_prefix';
          delete inventory.OSSBucketDestination.prefix;
          await store.putBucketInventory(bucket, inventory);
          assert(true);
        } catch (err) {
          assert(false, err);
        }
      });
      it('should put bucket inventory when has encryption', async () => {
        try {
          inventory.id = 'test_encryption_SSE-OSS';
          inventory.OSSBucketDestination.encryption = { 'SSE-OSS': '' };
          await store.putBucketInventory(bucket, inventory);
          assert(true);
        } catch (err) {
          assert(false, err);
        }
      });
    });
    describe('getBucketInventory', () => {
      let testGetInventory;
      it('should get bucket inventory by inventoryId', async () => {
        try {
          const result = await store.getBucketInventory(bucket, inventory.id);
          testGetInventory = result.inventory;
          assert(includesConf(testGetInventory, inventory));
        } catch (err) {
          assert(false);
        }
      });
      it('should return Field array when Field value is one length Array', async () => {
        try {
          assert(
            testGetInventory.optionalFields &&
              testGetInventory.optionalFields.field &&
              Array.isArray(testGetInventory.optionalFields.field) &&
              testGetInventory.optionalFields.field.length === 1
          );
        } catch (err) {
          assert(false);
        }
      });
    });
    describe('listBucketInventory', () => {
      before(async () => {
        let _index = 0;
        async function putInventoryList() {
          await Promise.all(
            new Array(1).fill(1).map(() => {
              _index++;
              return store.putBucketInventory(bucket, Object.assign({}, inventory, { id: `test_list_${_index}` }));
            })
          );
        }

        await putInventoryList();
      });
      it('should list bucket inventory', async () => {
        const inventoryRes = await store.listBucketInventory(bucket);
        assert.strictEqual(inventoryRes.status, 200);
      });
    });
    describe('deleteBucketInventory', () => {
      it('should delete bukcet inventory', async () => {
        let inventoryList = [];
        let isTruncated;
        let continuationToken;
        do {
          const inventoryRes = await store.listBucketInventory(bucket, { continuationToken });
          inventoryList = [...inventoryList, ...inventoryRes.inventoryList];
          isTruncated = inventoryRes.isTruncated;
          continuationToken = inventoryRes.nextContinuationToken;
        } while (isTruncated);
        try {
          // avoid Qps limit
          do {
            const list = inventoryList.splice(0, 10);
            await Promise.all(list.map(_ => store.deleteBucketInventory(bucket, _.id)));
            utils.sleep(400);
          } while (inventoryList.length);
          assert(true);
        } catch (err) {
          assert(false, err);
        }
      });
    });
  });
});
