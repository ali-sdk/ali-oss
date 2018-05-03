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
const config = require('../config').oss;

describe('test/rtmp.test.js', () => {
  const { prefix } = utils;
  let store;
  let bucket;
  let bucketRegion;
  let cid;
  let conf;
  before(async () => {
    store = oss(config);
    bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    store.useBucket(bucket);

    const result = await store.putBucket(bucket, bucketRegion);
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);

    cid = 'channel-1';
    conf = {
      Description: 'this is channel 1',
      Status: 'enabled',
      Target: {
        Type: 'HLS',
        FragDuration: '10',
        FragCount: '5',
        PlaylistName: 'playlist.m3u8',
      },
    };
  });

  after(async () => {
    await utils.cleanBucket(store, bucket, bucketRegion);
  });

  describe('put/get/deleteChannel()', () => {
    it('should create a new channel', async () => {
      const tempCid = cid;
      const tempConf = conf;

      let result = await store.putChannel(tempCid, tempConf);
      assert.equal(result.res.status, 200);
      assert(is.array(result.publishUrls));
      assert(result.publishUrls.length > 0);
      assert(is.array(result.playUrls));
      assert(result.playUrls.length > 0);

      result = await store.getChannel(tempCid);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.data, conf);

      result = await store.deleteChannel(tempCid);
      assert.equal(result.res.status, 204);

      await utils.throws(async () => {
        await store.getChannel(tempCid);
      }, (err) => {
        assert.equal(err.status, 404);
      });
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

      for (let i = 0; i < channelNum; i++) {
        conf.Description = i;
        /* eslint no-await-in-loop: [0] */
        await store.putChannel(channelPrefix + i, conf);
      }
    });

    after(async () => {
      for (let i = 0; i < channelNum; i++) {
        /* eslint no-await-in-loop: [0] */
        await store.deleteChannel(channelPrefix + i);
      }
    });

    it('list channels using prefix/marker/max-keys', async () => {
      const query = {
        prefix: 'channel-list-',
        marker: 'channel-list-4',
        'max-keys': 3,
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
      console.log(result);
      const url = store.getRtmpUrl(createVodCid, {
        params: {
          playlistName: 'vod.m3u8',
        },
        expires: 3600,
      });
      console.log(url);
    });

    after(async () => {
      await store.deleteChannel(createVodCid);
    });

    // this case need have data in server
    it.skip('should create vod playlist', async () => {
      const name = 'vod.m3u8';
      const now = Date.now();

      try {
        const result = await store.createVod(cid, name, {
          startTime: Math.floor((now - 100) / 1000),
          endTime: Math.floor(now / 1000),
        });

        assert.equal(result.res.status, 200);
      } catch (err) {
        console.error(err);
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
      console.log(result);
    });

    after(async () => {
      await store.deleteChannel(getRtmpUrlCid);
    });

    it('should get rtmp url', () => {
      const name = 'vod.m3u8';
      const url = store.getRtmpUrl(getRtmpUrlCid, {
        params: {
          playlistName: name,
        },
        expires: 3600,
      });
      console.log(url);
      // verify the url is ok used by OBS or ffmpeg
    });
  });
});
