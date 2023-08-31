/**
 * Copyright(c) ali-sdk and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   rockuw <rockuw@gmail.com> (http://rockuw.com)
 */

/**
 * Module dependencies.
 */

const jstoxml = require('jstoxml');
const utility = require('utility');
const copy = require('copy-to');
const urlutil = require('url');

const proto = exports;

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
proto.putChannel = async function putChannel(id, conf, options) {
  options = options || {};
  options.subres = 'live';

  const params = this._objectRequestParams('PUT', id, options);
  params.xmlResponse = true;
  params.content = jstoxml.toXML({
    LiveChannelConfiguration: conf
  });
  params.successStatuses = [200];

  const result = await this.request(params);

  let publishUrls = result.data.PublishUrls.Url;
  if (!Array.isArray(publishUrls)) {
    publishUrls = [publishUrls];
  }
  let playUrls = result.data.PlayUrls.Url;
  if (!Array.isArray(playUrls)) {
    playUrls = [playUrls];
  }

  return {
    publishUrls,
    playUrls,
    res: result.res
  };
};

/**
 * Get the channel info
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
proto.getChannel = async function getChannel(id, options) {
  options = options || {};
  options.subres = 'live';

  const params = this._objectRequestParams('GET', id, options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

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
proto.deleteChannel = async function deleteChannel(id, options) {
  options = options || {};
  options.subres = 'live';

  const params = this._objectRequestParams('DELETE', id, options);
  params.successStatuses = [204];

  const result = await this.request(params);

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
proto.putChannelStatus = async function putChannelStatus(id, status, options) {
  options = options || {};
  options.subres = {
    live: null,
    status
  };

  const params = this._objectRequestParams('PUT', id, options);
  params.successStatuses = [200];

  const result = await this.request(params);

  return {
    res: result.res
  };
};

/**
 * Get the channel status
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
proto.getChannelStatus = async function getChannelStatus(id, options) {
  options = options || {};
  options.subres = {
    live: null,
    comp: 'stat'
  };

  const params = this._objectRequestParams('GET', id, options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

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
proto.listChannels = async function listChannels(query, options) {
  // prefix, marker, max-keys

  options = options || {};
  options.subres = 'live';

  const params = this._objectRequestParams('GET', '', options);
  params.query = query;
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

  let channels = result.data.LiveChannel || [];
  if (!Array.isArray(channels)) {
    channels = [channels];
  }

  channels = channels.map(x => {
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
    channels,
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
proto.getChannelHistory = async function getChannelHistory(id, options) {
  options = options || {};
  options.subres = {
    live: null,
    comp: 'history'
  };

  const params = this._objectRequestParams('GET', id, options);
  params.xmlResponse = true;
  params.successStatuses = [200];

  const result = await this.request(params);

  let records = result.data.LiveRecord || [];
  if (!Array.isArray(records)) {
    records = [records];
  }
  return {
    records,
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
proto.createVod = async function createVod(id, name, time, options) {
  options = options || {};
  options.subres = {
    vod: null
  };
  copy(time).to(options.subres);

  const params = this._objectRequestParams('POST', `${id}/${name}`, options);
  params.query = time;
  params.successStatuses = [200];

  const result = await this.request(params);

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
  const expires = utility.timestamp() + (options.expires || 1800);
  const res = {
    bucket: this.options.bucket,
    object: this._objectName(`live/${channelId}`)
  };
  const resource = `/${res.bucket}/${channelId}`;

  options.params = options.params || {};
  const query = Object.keys(options.params)
    .sort()
    .map(x => `${x}:${options.params[x]}\n`)
    .join('');

  const stringToSign = `${expires}\n${query}${resource}`;
  const signature = this.signature(stringToSign);

  const url = urlutil.parse(this._getReqUrl(res));
  url.protocol = 'rtmp:';
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signature
  };
  copy(options.params).to(url.query);

  return url.format();
};
