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

  before(function* () {
    this.store = oss(config);
    this.bucket = `ali-oss-test-bucket-${prefix.replace(/[/.]/g, '-')}`;
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.store.useBucket(this.bucket);

    const result = yield this.store.putBucket(this.bucket, this.region);
    assert.equal(result.bucket, this.bucket);
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

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('put/get/deleteChannel()', () => {
    it('should create a new channel', function* () {
      const { cid } = this;
      const { conf } = this;

      let result = yield this.store.putChannel(cid, conf);
      assert.equal(result.res.status, 200);
      assert(is.array(result.publishUrls));
      assert(result.publishUrls.length > 0);
      assert(is.array(result.playUrls));
      assert(result.playUrls.length > 0);

      result = yield this.store.getChannel(cid);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.data, conf);

      result = yield this.store.deleteChannel(cid);
      assert.equal(result.res.status, 204);

      yield utils.throws(function* () {
        yield this.store.getChannel(cid);
      }.bind(this), (err) => {
        assert.equal(err.status, 404);
      });
    });
  });

  describe('put/getChannelStatus()', () => {
    before(function* () {
      this.cid = 'live channel 2';
      this.conf.Description = 'this is live channel 2';
      yield this.store.putChannel(this.cid, this.conf);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    it('should disable channel', function* () {
      let result = yield this.store.getChannelStatus(this.cid);
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'Idle');

      // TODO: verify ConnectedTime/RemoteAddr/Video/Audio when not idle

      result = yield this.store.putChannelStatus(this.cid, 'disabled');
      assert.equal(result.res.status, 200);

      result = yield this.store.getChannelStatus(this.cid);
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'Disabled');
    });
  });

  describe('listChannels()', () => {
    before(function* () {
      this.channelNum = 10;
      this.channelPrefix = 'channel-list-';

      for (let i = 0; i < this.channelNum; i++) {
        this.conf.Description = i;
        yield this.store.putChannel(this.channelPrefix + i, this.conf);
      }
    });

    after(function* () {
      for (let i = 0; i < this.channelNum; i++) {
        yield this.store.deleteChannel(this.channelPrefix + i);
      }
    });

    it('list channels using prefix/marker/max-keys', function* () {
      const query = {
        prefix: 'channel-list-',
        marker: 'channel-list-4',
        'max-keys': 3,
      };

      const result = yield this.store.listChannels(query);

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
    before(function* () {
      this.cid = 'channel-3';
      this.conf.Description = 'this is live channel 3';
      yield this.store.putChannel(this.cid, this.conf);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    it('should get channel history', function* () {
      const result = yield this.store.getChannelHistory(this.cid);

      assert.equal(result.res.status, 200);
      assert(is.array(result.records));
      assert.equal(result.records.length, 0);

      // TODO: verify LiveRecord when history exists
      // verify wish OBS or ffmpeg
    });
  });

  describe('createVod()', () => {
    before(function* () {
      this.cid = 'channel-4';
      this.conf.Description = 'this is live channel 4';
      const result = yield this.store.putChannel(this.cid, this.conf);
      console.log(result);
      const url = this.store.getRtmpUrl(this.cid, {
        params: {
          playlistName: 'vod.m3u8',
        },
        expires: 3600,
      });
      console.log(url);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    // this case need have data in server
    it.skip('should create vod playlist', function* () {
      const name = 'vod.m3u8';
      const now = Date.now();

      try {
        const result = yield this.store.createVod(this.cid, name, {
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
    before(function* () {
      this.cid = 'channel-5';
      this.conf.Description = 'this is live channel 5';
      const result = yield this.store.putChannel(this.cid, this.conf);
      console.log(result);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    /* eslint require-yield: [0] */
    it('should get rtmp url', function* () {
      const name = 'vod.m3u8';
      const url = this.store.getRtmpUrl(this.cid, {
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
