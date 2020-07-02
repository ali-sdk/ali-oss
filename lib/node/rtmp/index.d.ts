/**
 * Create a live channel
 * @param {String} id the channel id
 * @param {Object} conf the channel configuration
 * @param {Object} options
 * @return {Object}
 */
export declare function putChannel(this: any, id: any, conf: any, options?: any): Promise<{
    publishUrls: any;
    playUrls: any;
    res: any;
}>;
/**
 * Get the channel info
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function getChannel(this: any, id: any, options?: any): Promise<{
    data: any;
    res: any;
}>;
/**
 * Delete the channel
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function deleteChannel(this: any, id: any, options?: any): Promise<{
    res: any;
}>;
/**
 * Set the channel status
 * @param {String} id the channel id
 * @param {String} status the channel status
 * @param {Object} options
 * @return {Object}
 */
export declare function putChannelStatus(this: any, id: any, status: any, options?: any): Promise<{
    res: any;
}>;
/**
 * Get the channel status
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function getChannelStatus(this: any, id: any, options?: any): Promise<{
    data: any;
    res: any;
}>;
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
export declare function listChannels(this: any, query: any, options?: any): Promise<{
    channels: any;
    nextMarker: any;
    isTruncated: boolean;
    res: any;
}>;
/**
 * Get the channel history
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function getChannelHistory(this: any, id: any, options?: any): Promise<{
    records: any;
    res: any;
}>;
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
export declare function createVod(this: any, id: any, name: any, time: any, options?: any): Promise<{
    res: any;
}>;
/**
 * Get RTMP Url
 * @param {String} channelId the channel id
 * @param {Object} options
 *  options:
 *   - expires {Number}: expire time in seconds
 *   - params {Object}: the parameters such as 'playlistName'
 * @return {String} the RTMP url
 */
export declare function getRtmpUrl(this: any, channelId: any, options?: any): any;
declare const _default: {
    putChannel: typeof putChannel;
    getChannel: typeof getChannel;
    deleteChannel: typeof deleteChannel;
    putChannelStatus: typeof putChannelStatus;
    getChannelStatus: typeof getChannelStatus;
    listChannels: typeof listChannels;
    getChannelHistory: typeof getChannelHistory;
    createVod: typeof createVod;
    getRtmpUrl: typeof getRtmpUrl;
};
export default _default;
