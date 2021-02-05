"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRtmpUrl = exports.createVod = exports.getChannelHistory = exports.listChannels = exports.getChannelStatus = exports.putChannelStatus = exports.deleteChannel = exports.getChannel = exports.putChannel = void 0;
const jstoxml_1 = __importDefault(require("jstoxml"));
const utility_1 = __importDefault(require("utility"));
const copy_to_1 = __importDefault(require("copy-to"));
const url_1 = __importDefault(require("url"));
const _objectRequestParams_1 = require("../../common/client/_objectRequestParams");
const _getReqUrl_1 = require("../../common/client/_getReqUrl");
const objectName_1 = require("../../common/utils/objectName");
/**
 * Create a live channel
 * @param {String} id the channel id
 * @param {Object} conf the channel configuration
 * @param {Object} options
 * @return {Object}
 */
async function putChannel(id, conf, options = {}) {
    options.subres = 'live';
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'PUT', id, options);
    params.xmlResponse = true;
    params.content = jstoxml_1.default.toXML({
        LiveChannelConfiguration: conf,
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
        res: result.res,
    };
}
exports.putChannel = putChannel;
/**
 * Get the channel info
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
async function getChannel(id, options = {}) {
    options.subres = 'live';
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'GET', id, options);
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        data: result.data,
        res: result.res,
    };
}
exports.getChannel = getChannel;
/**
 * Delete the channel
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
async function deleteChannel(id, options = {}) {
    options.subres = 'live';
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'DELETE', id, options);
    params.successStatuses = [204];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.deleteChannel = deleteChannel;
/**
 * Set the channel status
 * @param {String} id the channel id
 * @param {String} status the channel status
 * @param {Object} options
 * @return {Object}
 */
async function putChannelStatus(id, status, options = {}) {
    options.subres = {
        live: null,
        status,
    };
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'PUT', id, options);
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.putChannelStatus = putChannelStatus;
/**
 * Get the channel status
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
async function getChannelStatus(id, options = {}) {
    options.subres = {
        live: null,
        comp: 'stat',
    };
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'GET', id, options);
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        data: result.data,
        res: result.res,
    };
}
exports.getChannelStatus = getChannelStatus;
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
async function listChannels(query, options = {}) {
    // prefix, marker, max-keys
    options.subres = 'live';
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'GET', '', options);
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
        res: result.res,
    };
}
exports.listChannels = listChannels;
/**
 * Get the channel history
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
async function getChannelHistory(id, options = {}) {
    options.subres = {
        live: null,
        comp: 'history',
    };
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'GET', id, options);
    params.xmlResponse = true;
    params.successStatuses = [200];
    const result = await this.request(params);
    let records = result.data.LiveRecord || [];
    if (!Array.isArray(records)) {
        records = [records];
    }
    return {
        records,
        res: result.res,
    };
}
exports.getChannelHistory = getChannelHistory;
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
async function createVod(id, name, time, options = {}) {
    options.subres = {
        vod: null,
    };
    copy_to_1.default(time, false).to(options.subres);
    const params = _objectRequestParams_1._objectRequestParams.call(this, 'POST', `${id}/${name}`, options);
    params.query = time;
    params.successStatuses = [200];
    const result = await this.request(params);
    return {
        res: result.res,
    };
}
exports.createVod = createVod;
/**
 * Get RTMP Url
 * @param {String} channelId the channel id
 * @param {Object} options
 *  options:
 *   - expires {Number}: expire time in seconds
 *   - params {Object}: the parameters such as 'playlistName'
 * @return {String} the RTMP url
 */
function getRtmpUrl(channelId, options = {}) {
    const expires = utility_1.default.timestamp() + (options.expires || 1800);
    const res = {
        bucket: this.options.bucket,
        object: objectName_1.objectName.call(this, `live/${channelId}`),
    };
    const resource = `/${res.bucket}/${channelId}`;
    options.params = options.params || {};
    const query = Object.keys(options.params)
        .sort()
        .map(x => `${x}:${options.params[x]}\n`)
        .join('');
    const stringToSign = `${expires}\n${query}${resource}`;
    const signature = this.signature(stringToSign);
    const url = url_1.default.parse(_getReqUrl_1._getReqUrl.call(this, res));
    url.protocol = 'rtmp:';
    url.query = {
        OSSAccessKeyId: this.options.accessKeyId,
        Expires: expires,
        Signature: signature,
    };
    copy_to_1.default(options.params, false).to(url.query);
    return url.format();
}
exports.getRtmpUrl = getRtmpUrl;
exports.default = {
    putChannel,
    getChannel,
    deleteChannel,
    putChannelStatus,
    getChannelStatus,
    listChannels,
    getChannelHistory,
    createVod,
    getRtmpUrl,
};
