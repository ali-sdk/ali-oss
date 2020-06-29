const debug = require('debug')('ali-oss');
const AgentKeepalive = require('agentkeepalive');
const merge = require('merge-descriptors');
const platform = require('platform');
const urllib = require('urllib');
const { initOptions } = require('../common/client/initOptions');
const { mergeDefault } = require('../common/utils/mergeDefault');

const globalHttpAgent = new AgentKeepalive();

function _unSupportBrowserTip() {
  const { name, version } = platform;
  if (name && name.toLowerCase && name.toLowerCase() === 'ie' && version.split('.')[0] < 10) {
    // eslint-disable-next-line no-console
    console.warn('ali-oss does not support the current browser');
  }
}
// check local web protocol,if https secure default set true , if http secure default set false
function isHttpsWebProtocol() {
  // for web worker not use window.location.
  // eslint-disable-next-line no-restricted-globals
  return location && location.protocol === 'https:';
}

function Client(options, ctx) {
  _unSupportBrowserTip();
  if (!(this instanceof Client)) {
    return new Client(options, ctx);
  }
  if (options && options.inited) {
    this.options = options;
  } else {
    this.options = Client.initOptions(options);
  }

  this.options.cancelFlag = false;// cancel flag: if true need to be cancelled, default false

  // support custom agent and urllib client
  if (this.options.urllib) {
    this.urllib = this.options.urllib;
  } else {
    this.urllib = urllib;
    this.agent = this.options.agent || globalHttpAgent;
  }
  this.ctx = ctx;
  this.userAgent = this._getUserAgent();

  // record the time difference between client and server
  this.options.amendTimeSkewed = 0;
}

/**
 * Expose `Client`
 */

module.exports = Client;

Client.initOptions = initOptions


/**
 * prototype
 */

const proto = Client.prototype;

// mount debug on proto
proto.debug = debug;

mergeDefault(proto, require('./object'));
mergeDefault(proto, require('../common/client'));
mergeDefault(proto, require('../browser/client/index'));
mergeDefault(proto, require('../common/multipart/index'));
mergeDefault(proto, require('../browser/multipart/multipartUpload'));
mergeDefault(proto, require('../common/utils'));
mergeDefault(proto, require('../common/object'));
mergeDefault(proto, require('../common/image'));
mergeDefault(proto, require('../common/bucket'));
