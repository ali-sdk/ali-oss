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
  before(async () => {
    store = oss(config);
    bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    bucket = bucket.substring(0, bucket.length - 1);
    store.useBucket(bucket);

    const result = await store.putBucket(bucket, bucketRegion);
    assert.equal(result.bucket, bucket);
    assert.equal(result.res.status, 200);

    this.cid = 'channel-1';
    this.conf = {
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
      const { cid } = this;
      const { conf } = this;

      let result = await store.putChannel(cid, conf);
      assert.equal(result.res.status, 200);
      assert(is.array(result.publishUrls));
      assert(result.publishUrls.length > 0);
      assert(is.array(result.playUrls));
      assert(result.playUrls.length > 0);

      result = await store.getChannel(cid);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.data, conf);

      result = await store.deleteChannel(cid);
      assert.equal(result.res.status, 204);

      await utils.throws(async () => {
        await store.getChannel(cid);
      }, (err) => {
        assert.equal(err.status, 404);
      });
    });
  });

  describe('put/getChannelStatus()', () => {
    before(async () => {
      this.cid = 'live channel 2';
      this.conf.Description = 'this is live channel 2';
      await store.putChannel(this.cid, this.conf);
    });

    after(async () => {
      await store.deleteChannel(this.cid);
    });

    it('should disable channel', async () => {
      let result = await store.getChannelStatus(this.cid);
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'Idle');

      // TODO: verify ConnectedTime/RemoteAddr/Video/Audio when not idle

      result = await store.putChannelStatus(this.cid, 'disabled');
      assert.equal(result.res.status, 200);

      result = await store.getChannelStatus(this.cid);
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'Disabled');
    });
  });

  describe('listChannels()', () => {
    before(async () => {
      this.channelNum = 10;
      this.channelPrefix = 'channel-list-';

      for (let i = 0; i < this.channelNum; i++) {
        this.conf.Description = i;
        /* eslint no-await-in-loop: [0] */
        await store.putChannel(this.channelPrefix + i, this.conf);
      }
    });

    after(async () => {
      for (let i = 0; i < this.channelNum; i++) {
        /* eslint no-await-in-loop: [0] */
        await store.deleteChannel(this.channelPrefix + i);
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
      assert.equal(channels[0].Name, this.channelPrefix + 5);
      assert.equal(channels[1].Name, this.channelPrefix + 6);
      assert.equal(channels[2].Name, this.channelPrefix + 7);
    });
  });

  describe('getChannelHistory()', () => {
    before(async () => {
      this.cid = 'channel-3';
      this.conf.Description = 'this is live channel 3';
      await store.putChannel(this.cid, this.conf);
    });

    after(async () => {
      await store.deleteChannel(this.cid);
    });

    it('should get channel history', async () => {
      const result = await store.getChannelHistory(this.cid);

      assert.equal(result.res.status, 200);
      assert(is.array(result.records));
      assert.equal(result.records.length, 0);

      // TODO: verify LiveRecord when history exists
      // verify wish OBS or ffmpeg
    });
  });

  describe('createVod()', () => {
    before(async () => {
      this.cid = 'channel-4';
      this.conf.Description = 'this is live channel 4';
      const result = await store.putChannel(this.cid, this.conf);
      console.log(result);
      const url = store.getRtmpUrl(this.cid, {
        params: {
          playlistName: 'vod.m3u8',
        },
        expires: 3600,
      });
      console.log(url);
    });

    after(async () => {
      await store.deleteChannel(this.cid);
    });

    // this case need have data in server
    it.skip('should create vod playlist', async () => {
      const name = 'vod.m3u8';
      const now = Date.now();

      try {
        const result = await store.createVod(this.cid, name, {
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
    before(async () => {
      this.cid = 'channel-5';
      this.conf.Description = 'this is live channel 5';
      const result = await store.putChannel(this.cid, this.conf);
      console.log(result);
    });

    after(async () => {
      await store.deleteChannel(this.cid);
    });

    it('should get rtmp url', () => {
      const name = 'vod.m3u8';
      const url = store.getRtmpUrl(this.cid, {
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
