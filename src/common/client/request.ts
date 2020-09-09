import _debug from 'debug';
import { parseXML } from '../utils/parseXML';
import { setSTSToken } from '../utils/setSTSToken';

const debug = _debug('ali-oss');

/**
 * request oss server
 * @param {Object} params
 *   - {String} object
 *   - {String} bucket
 *   - {Object} [headers]
 *   - {Object} [query]
 *   - {Buffer} [content]
 *   - {Stream} [stream]
 *   - {Stream} [writeStream]
 *   - {String} [mime]
 *   - {Boolean} [xmlResponse]
 *   - {Boolean} [customResponse]
 *   - {Number} [timeout]
 *   - {Object} [ctx] request context, default is `this.ctx`
 *
 * @api private
 */

export async function request(this: any, params) {
  const reqParams = this._createRequest(params);
  const isNode = this._getUserAgent().includes('nodejs');

  if (!isNode && !this.options.useFetch) {
    reqParams.params.mode = 'disable-fetch';
  }
  let result;
  let reqErr;
  const useStream = !!params.stream;
  try {
    result = await this.urllib.request(reqParams.url, reqParams.params);
    debug('response %s %s, got %s, headers: %j', params.method, reqParams.url, result.status, result.headers);
  } catch (err) {
    reqErr = err;
  }
  let err;
  if (result && params.successStatuses && params.successStatuses.indexOf(result.status) === -1) {
    err = await this.requestError(result);
    // not use stream
    if (err.code === 'RequestTimeTooSkewed' && !useStream && !isNode) {
      this.options.amendTimeSkewed = +new Date(err.serverTime) - new Date().valueOf();
      return await this.request(params);
    }
    err.params = params;
  } else if (reqErr) {
    err = await this.requestError(reqErr);
  }

  if (err) {
    if (this.sendToWormhole && params.customResponse && result && result.res) {
      // consume the response stream
      await this.sendToWormhole(result.res);
    }

    if (err.status === 403 && err.code === 'InvalidAccessKeyId' &&
     this.options.accessKeyId.startsWith('STS.') &&
     typeof this.options.refreshSTSToken === 'function') {
      // prevent infinite loop, only trigger once within 10 seconds
      if (!this._setOptions || Date.now() - this._setOptions > 10000) {
        this._setOptions = Date.now();
        await setSTSToken.call(this);
        return this.request(params);
      }
    }
    throw err;
  }

  if (params.xmlResponse) {
    result.data = await parseXML(result.data);
  }
  return result;
}
