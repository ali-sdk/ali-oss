/**!
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (http://rockuw.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var assert = require('assert');
var utils = require('./utils');
var is = require('is-type-of');
var oss = require('../');
var config = require('./config').oss;
var ms = require('humanize-ms');
var metaSyncTime = require('./config').metaSyncTime;

describe.only('test/rtmp.test.js', function () {
  var prefix = utils.prefix;

  before(function* () {
    this.store = oss(config);
    this.bucket = 'ali-oss-test-bucket-' + prefix.replace(/[\/\.]/g, '-');
    this.bucket = this.bucket.substring(0, this.bucket.length - 1);
    this.store.useBucket(this.bucket);

    var result = yield this.store.putBucket(this.bucket, this.region);
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
        PlaylistName: 'playlist.m3u8'
      }
    };
  });

  after(function* () {
    yield utils.cleanBucket(this.store, this.bucket, this.region);
  });

  describe('put/get/deleteChannel()', function () {
    it('should create a new channel', function* () {
      var cid = this.cid;
      var conf = this.conf;

      var result = yield this.store.putChannel(cid, conf);
      assert.equal(result.res.status, 200);
      assert(is.array(result.publishUrls));
      assert(result.publishUrls.length > 0);
      assert(is.array(result.playUrls));
      assert(result.playUrls.length > 0);

      var result = yield this.store.getChannel(cid);
      assert.equal(result.res.status, 200);
      assert.deepEqual(result.data, conf);

      var result = yield this.store.deleteChannel(cid);
      assert.equal(result.res.status, 204);

      yield utils.throws(function* () {
        var result = yield this.store.getChannel(cid);
      }.bind(this), function (err) {
        assert.equal(err.status, 404);
      });
    });
  });

  describe('put/getChannelStatus()', function () {
    before(function* () {
      this.cid = 'live channel 2';
      this.conf.Description = 'this is live channel 2';
      yield this.store.putChannel(this.cid, this.conf);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    it('should disable channel', function* () {
      var result = yield this.store.getChannelStatus(this.cid);
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'Idle');

      // TODO: verify ConnectedTime/RemoteAddr/Video/Audio when not idle

      var result = yield this.store.putChannelStatus(this.cid, 'disabled');
      assert.equal(result.res.status, 200);

      var result = yield this.store.getChannelStatus(this.cid);
      assert.equal(result.res.status, 200);
      assert.equal(result.data.Status, 'Disabled');
    });
  });

  describe('listChannels()', function () {
    before(function* () {
      this.channelNum = 10;
      this.channelPrefix = 'channel-list-';

      for (var i = 0; i < this.channelNum; i ++) {
        this.conf.Description = i;
        yield this.store.putChannel(this.channelPrefix + i, this.conf);
      }
    });

    after(function* () {
      for (var i = 0; i < this.channelNum; i ++) {
        yield this.store.deleteChannel(this.channelPrefix + i);
      }
    });

    it('list channels using prefix/marker/max-keys', function* () {
      var query = {
        prefix: 'channel-list-',
        marker: 'channel-list-4',
        'max-keys': 3
      };

      var result = yield this.store.listChannels(query);

      assert.equal(result.res.status, 200);
      assert.equal(result.nextMarker, 'channel-list-7');
      assert.equal(result.isTruncated, true);

      var channels = result.channels;
      assert.equal(channels.length, 3);
      assert.equal(channels[0].Name, this.channelPrefix + 5)
      assert.equal(channels[1].Name, this.channelPrefix + 6)
      assert.equal(channels[2].Name, this.channelPrefix + 7)
    });
  });

  describe('getChannelHistory()', function () {
    before(function* () {
      this.cid = 'channel-3';
      this.conf.Description = 'this is live channel 3';
      yield this.store.putChannel(this.cid, this.conf);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    it('should get channel history', function* () {
      var result = yield this.store.getChannelHistory(this.cid);

      assert.equal(result.res.status, 200);
      assert(is.array(result.records));
      assert.equal(result.records.length, 0);

      // TODO: verify LiveRecord when history exists
    });
  });

  describe('createVod()', function () {
    before(function* () {
      this.cid = 'channel-4';
      this.conf.Description = 'this is live channel 4';
      yield this.store.putChannel(this.cid, this.conf);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    it('should create vod playlist', function* () {
      var name = 'vod.m3u8';
      var now = Date.now();
      var result = yield this.store.createVod(this.cid, name, {
        startTime: Math.floor((now - 100) / 1000),
        endTime: Math.floor(now / 1000)
      });

      assert.equal(result.res.status, 200);
    });
  });

  describe('getRtmpUrl()', function () {
    before(function* () {
      this.cid = 'channel-5';
      this.conf.Description = 'this is live channel 5';
      yield this.store.putChannel(this.cid, this.conf);
    });

    after(function* () {
      yield this.store.deleteChannel(this.cid);
    });

    it('should get rtmp url', function* () {
      var name = 'vod.m3u8';
      var url = this.store.getRtmpUrl(this.cid, {
        params: {
          playlistName: name
        },
        expires: 3600
      });

      // TODO: verify the url
    });
  });
});
