import { RequestOptions } from '../../types/params';
import { RTMPGetLiveChannelStatReturnType, RTMPListLiveChannelReturnType } from '../../types/rtmp';
interface IOptions {
    timeout?: number;
    subres?: any;
}
interface PutChannelConf {
    Description?: string;
    Status?: string;
    Target?: {
        Type: string;
        FragDuration: number;
        FragCount: number;
        PlaylistName: string;
    };
}
/**
 * Create a live channel
 * @param {String} id the channel id
 * @param {Object} conf the channel configuration
 * @param {Object} options
 * @return {Object}
 */
export declare function putChannel(this: any, id: string, conf: PutChannelConf, options?: IOptions): Promise<{
    publishUrls: string[];
    playUrls: string[];
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
}>;
/**
 * Get the channel info
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function getChannel(this: any, id: string, options?: IOptions): Promise<{
    data: Required<PutChannelConf>;
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
}>;
/**
 * Delete the channel
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function deleteChannel(this: any, id: string, options?: IOptions): Promise<{
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
}>;
/**
 * Set the channel status
 * @param {String} id the channel id
 * @param {String} status the channel status
 * @param {Object} options
 * @return {Object}
 */
export declare function putChannelStatus(this: any, id: string, status?: 'enabled' | 'disabled', options?: IOptions): Promise<{
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
}>;
/**
 * Get the channel status
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function getChannelStatus(this: any, id: string, options?: IOptions): Promise<RTMPGetLiveChannelStatReturnType>;
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
export declare function listChannels(this: any, query: {
    prefix?: string;
    marker?: string;
    'max-keys'?: number;
}, options?: IOptions): Promise<RTMPListLiveChannelReturnType>;
/**
 * Get the channel history
 * @param {String} id the channel id
 * @param {Object} options
 * @return {Object}
 */
export declare function getChannelHistory(this: any, id: string, options?: IOptions): Promise<{
    records: {
        StartTime: string;
        EndTime: string;
        RemoteAddr: string;
    }[];
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
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
export declare function createVod(this: any, id: string, name: string, time: {
    startTime: number;
    endTime: number;
}, options?: IOptions): Promise<{
    res: {
        status: number;
        headers: {
            server: string;
            date: string;
            'content-length': string;
            connection: string;
            'x-oss-request-id': string;
            vary: string;
            etag?: string | undefined;
            'x-oss-hash-crc64ecma'?: string | undefined;
            'content-md5'?: string | undefined;
            'x-oss-server-time': string;
        };
        size: number;
        rt: number;
        requestUrls: string[];
    };
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
export declare function getRtmpUrl(this: any, channelId: string, options?: RequestOptions & {
    expires?: number;
    params?: object;
}): string;
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
