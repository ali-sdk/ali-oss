/**
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

var debug = require('debug')('ali-oss:rtmp');
var jstoxml = require('jstoxml');
var utility = require('utility');
var copy = require('copy-to');
var urlutil = require('url');

var proto = exports;

/**
 * RTMP operations
 */

/**
 * Create a live channel
 * @param {String} id the channel id
 * @param {Object} conf the channel configuration
 * @param {Object} options
 * @return {Object}
 */
proto.putChannel = function* (id, conf, options) {
  options = options || {};
  options.subres = 'live';

  var params = this._objectRequestParams('PUT', id, options);
  params.xmlResponse = true;
  params.content = jstoxml.toXML({
    LiveChannelConfiguration: conf
  });
  params.successStatuses = [200];

  var result = yield this.request(params);

  var publishUrls = result.data.PublishUrls.Url;
  if (!Array.isArray(publishUrls)) {
    publishUrls = [publishUrls];
  }
  var playUrls = result.data.PlayUrls.Url;
  if (!Array.isArray(playUrls)) {
    playUrls = [playUrls];
  }

  return {
    publishUrls: publishUrls,
    playUrls: playUrls,
    res: result.res
  };
};

/**
 * Get the channel info
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
proto.getChannel = function* (id, options) {
  options = options || {};
  options.subres = 'live';

  var params = this._objectRequestParams('GET', id, options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    data: result.data,
    res: result.res
  };
};

/**
 * Delete the channel
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
proto.deleteChannel = function* (id, options) {
  options = options || {};
  options.subres = 'live';

  var params = this._objectRequestParams('DELETE', id, options);
  params.successStatuses = [204];

  var result = yield this.request(params);

  return {
    res: result.res
  };
};

/**
 * Set the channel status
 * @param {String} id the channel id
 * @param {String} status the channel status
 * @param {Object} options
 * @return {Object}
 */
proto.putChannelStatus = function* (id, status, options) {
  options = options || {};
  options.subres = {
    'live': null,
    'status': status
  };

  var params = this._objectRequestParams('PUT', id, options);
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    res: result.res,
  };
};

/**
 * Get the channel status
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
proto.getChannelStatus = function* (id, options) {
  options = options || {};
  options.subres = {
    'live': null,
    'comp': 'stat'
  };

  var params = this._objectRequestParams('GET', id, options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    data: result.data,
    res: result.res
  };
};

/**
 * List the channels
 * @param {Object} query the query parameters
 *  filter options:
 *   - prefix {String}: the channel id prefix (returns channels with this prefix)
 *   - marker {String}: the channle id marker (returns channels after this id)
 *   - max-keys {Number}: max number of channels to return
 * @param {Object} options
 * @return {Object}
 */
proto.listChannels = function* (query, options) {
  // prefix, marker, max-keys

  options = options || {};
  options.subres = 'live';

  var params = this._objectRequestParams('GET', '', options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);

  var channels = result.data.LiveChannel || [];
  if (!Array.isArray(channels)) {
    channels = [channels];
  }

  channels = channels.map(function (x) {
    x.PublishUrls = x.PublishUrls.Url;
    if (!Array.isArray(x.PublishUrls)) {
      x.PublishUrls = [x.PublishUrls];
    }
    x.PlayUrls = x.PlayUrls.Url;
    if (!Array.isArray(x.PlayUrls)) {
      x.PlayUrls = [x.PlayUrls];
    }

    return x;
  });

  return {
    channels: channels,
    nextMarker: result.data.NextMarker || null,
    isTruncated: result.data.IsTruncated === 'true',
    res: result.res
  };
};

/**
 * Get the channel history
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
proto.getChannelHistory = function* (id, options) {
  options = options || {};
  options.subres = {
    'live': null,
    'comp': 'history'
  };

  var params = this._objectRequestParams('GET', id, options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  var result = yield this.request(params);

  var records = result.data.LiveRecord || [];
  if (!Array.isArray(records)) {
    records = [records];
  }
  return {
    records: records,
    res: result.res
  };
};

/**
 * Create vod playlist
 * @param {String} id the channel id
 * @param {String} name the playlist name
 * @param {Object} time the begin and end time
 *  time:
 *   - startTime {Number}: the begin time in epoch seconds
 *   - endTime {Number}: the end time in epoch seconds
 * @param {Object} options
 * @return {Object}
 */
proto.createVod = function* (id, name, time, options) {
  options = options || {};
  options.subres = {
    'vod': null
  }
  copy(time).to(options.subres);

  var params = this._objectRequestParams('POST', id + '/' + name, options);
  params.query = time;
  params.successStatuses = [200];

  var result = yield this.request(params);

  return {
    res: result.res
  };
};

/**
 * Get RTMP Url
 * @param {String} channelId the channel id
 * @param {Object} options
 *  options:
 *   - expires {Number}: expire time in seconds
 *   - params {Object}: the parameters such as 'playlistName'
 * @return {String} the RTMP url
 */
proto.getRtmpUrl = function (channelId, options) {
  options = options || {};
  var expires = utility.timestamp() + (options.expires || 1800);
  var res = {
    bucket: this.options.bucket,
    object: this._objectName('live/' + channelId)
  };
  var resource = '/' + res.bucket + '/' + channelId;

  options.params = options.params || {};
  var query = Object.keys(options.params).sort().map(function (x) {
    return x + ':' + options.params[x] + '\n';
  }).join('');

  var stringToSign = expires + '\n' + query + resource;
  var signature = this.signature(stringToSign);

  var url = urlutil.parse(this._getReqUrl(res));
  url.protocol = 'rtmp:';
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signature
  }
  copy(options.params).to(url.query);

  return url.format();
}
