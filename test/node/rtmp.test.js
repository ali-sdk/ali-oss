/** !
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (http://rockuw.com)
 */

/**
 * Module dependencies.
 */

const assert = require('assert');
const utils = require('./utils');
const is = require('is-type-of');
const oss = require('../..');
const { oss: config, conditions } = require('../config');

describe('test/rtmp.test.js', () => {
  before(function () {
    if (config.cloudBoxId) this.skip(); // 云盒不支持channel
  });
  const { prefix } = utils;
  let store;
  let bucket;
  let bucketRegion;
  const cid = 'channel-1';
  const conf = {
    Description: 'this is channel 1',
    Status: 'enabled',
    Target: {
      Type: 'HLS',
      FragDuration: '10',
      FragCount: '5',
      PlaylistName: 'playlist.m3u8'
    }
  };
  conditions.forEach((moreConfigs, index) => {
    describe(`test rtmp in iterate ${index}`, () => {
      before(async () => {
        store = oss({ ...config, ...moreConfigs });
        bucket = `ali-oss-test-bucket-rtmp-${prefix.replace(/[/.]/g, '-')}${index}`;
        store.useBucket(bucket);

        const result = await store.putBucket(bucket, bucketRegion);
        assert.strictEqual(result.bucket, bucket);
        assert.strictEqual(result.res.status, 200);
      });

      // github CI will remove buckets
      after(async () => {
        await utils.cleanBucket(store, bucket);
      });

      describe('put/get/deleteChannel()', () => {
        it('should create a new channel', async () => {
          const tempCid = cid;
          const tempConf = conf;

          let result = await store.putChannel(tempCid, tempConf);
          assert.strictEqual(result.res.status, 200);
          assert(is.array(result.publishUrls));
          assert(result.publishUrls.length > 0);
          assert(is.array(result.playUrls));
          assert(result.playUrls.length > 0);

          result = await store.getChannel(tempCid);
          assert.strictEqual(result.res.status, 200);
          assert.deepStrictEqual(result.data, conf);

          result = await store.deleteChannel(tempCid);
          assert.strictEqual(result.res.status, 204);

          await utils.throws(
            async () => {
              await store.getChannel(tempCid);
            },
            err => {
              assert.strictEqual(err.status, 404);
            }
          );
        });
      });

      describe('put/getChannelStatus()', () => {
        let statusConfCid;
        before(async () => {
          statusConfCid = 'live channel 2';
          const statusConf = conf;
          statusConf.Description = 'this is live channel 2';
          await store.putChannel(statusConfCid, statusConf);
        });

        after(async () => {
          await store.deleteChannel(statusConfCid);
        });

        it('should disable channel', async () => {
          let result = await store.getChannelStatus(statusConfCid);
          assert.equal(result.res.status, 200);
          assert.equal(result.data.Status, 'Idle');

          // TODO: verify ConnectedTime/RemoteAddr/Video/Audio when not idle

          result = await store.putChannelStatus(statusConfCid, 'disabled');
          assert.equal(result.res.status, 200);

          result = await store.getChannelStatus(statusConfCid);
          assert.equal(result.res.status, 200);
          assert.equal(result.data.Status, 'Disabled');
        });
      });

      describe('listChannels()', () => {
        let channelNum;
        let channelPrefix;
        before(async () => {
          channelNum = 10;
          channelPrefix = 'channel-list-';
          await Promise.all(
            Array(channelNum)
              .fill(1)
              .map((_, i) => {
                conf.Description = i;
                return store.putChannel(channelPrefix + i, conf);
              })
          );
        });

        after(async () => {
          await Promise.all(
            Array(channelNum)
              .fill(1)
              .map((_, i) => store.deleteChannel(channelPrefix + i))
          );
        });

        it('list channels using prefix/marker/max-keys', async () => {
          const query = {
            prefix: 'channel-list-',
            marker: 'channel-list-4',
            'max-keys': 3
          };

          const result = await store.listChannels(query);

          assert.equal(result.res.status, 200);
          assert.equal(result.nextMarker, 'channel-list-7');
          assert.equal(result.isTruncated, true);

          const { channels } = result;
          assert.equal(channels.length, 3);
          assert.equal(channels[0].Name, channelPrefix + 5);
          assert.equal(channels[1].Name, channelPrefix + 6);
          assert.equal(channels[2].Name, channelPrefix + 7);
        });
      });

      describe('getChannelHistory()', () => {
        let historyCid;
        before(async () => {
          historyCid = 'channel-3';
          const historyconf = conf;
          historyconf.Description = 'this is live channel 3';
          await store.putChannel(historyCid, historyconf);
        });

        after(async () => {
          await store.deleteChannel(historyCid);
        });

        it('should get channel history', async () => {
          const result = await store.getChannelHistory(historyCid);

          assert.equal(result.res.status, 200);
          assert(is.array(result.records));
          assert.equal(result.records.length, 0);

          // TODO: verify LiveRecord when history exists
          // verify wish OBS or ffmpeg
        });
      });

      describe('createVod()', () => {
        let createVodCid;
        before(async () => {
          createVodCid = 'channel-4';
          const createVodConf = conf;
          createVodConf.Description = 'this is live channel 4';
          const result = await store.putChannel(createVodCid, createVodConf);
          assert.equal(result.res.status, 200);
          store.getRtmpUrl(createVodCid, {
            params: {
              playlistName: 'vod.m3u8'
            },
            expires: 3600
          });
        });

        after(async () => {
          await store.deleteChannel(createVodCid);
        });

        // this case need have data in server
        it('should create vod playlist', async () => {
          const name = 'vod.m3u8';
          const now = Date.now();

          try {
            const result = await store.createVod(cid, name, {
              startTime: Math.floor((now - 100) / 1000),
              endTime: Math.floor(now / 1000)
            });

            assert.strictEqual(result.res.status, 200);
            // todo verify file
          } catch (err) {
            // todo remove catch error
            assert.strictEqual(err.status, 400);
            assert.strictEqual(err.code, 'InvalidArgument');
            assert.strictEqual(err.ecCode, '0044-00000308');
          }
        });
      });

      describe('getRtmpUrl()', () => {
        let getRtmpUrlCid;
        before(async () => {
          getRtmpUrlCid = 'channel-5';
          const getRtmpUrlConf = conf;
          getRtmpUrlConf.Description = 'this is live channel 5';
          const result = await store.putChannel(getRtmpUrlCid, getRtmpUrlConf);
          assert.strictEqual(result.res.status, 200);
        });

        after(async () => {
          await store.deleteChannel(getRtmpUrlCid);
        });

        it('should get rtmp url', () => {
          const name = 'vod.m3u8';
          const url = store.getRtmpUrl(getRtmpUrlCid, {
            params: {
              playlistName: name
            },
            expires: 3600
          });
          assert(url.includes(getRtmpUrlCid) && url.includes(name));
          // todo verify the url is ok used by OBS or ffmpeg
        });
      });
    });
  });
});
