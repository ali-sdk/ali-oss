
const AgentKeepalive = require('agentkeepalive');
const HttpsAgentKeepalive = require('agentkeepalive').HttpsAgent;
const merge = require('merge-descriptors');
const urllib = require('urllib');
const { initOptions } = require('./common/client/initOptions');
const { mergeDefault } = require('./common/utils/mergeDefault');

const globalHttpAgent = new AgentKeepalive();
const globalHttpsAgent = new HttpsAgentKeepalive();

function Client(options, ctx) {
  if (!(this instanceof Client)) {
    return new Client(options, ctx);
  }

  if (options && options.inited) {
    this.options = options;
  } else {
    this.options = Client.initOptions(options);
  }

  // support custom agent and urllib client
  if (this.options.urllib) {
    this.urllib = this.options.urllib;
  } else {
    this.urllib = urllib;
    this.agent = this.options.agent || globalHttpAgent;
    this.httpsAgent = this.options.httpsAgent || globalHttpsAgent;
  }
  this.ctx = ctx;
  this.userAgent = this._getUserAgent();
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

/**
 * Object operations
 */
mergeDefault(proto, require('./common/image'));
/**
 * Bucket operations
 */
mergeDefault(proto, require('./common/bucket'));
/**
 * RTMP operations
 */
merge(proto, require('./rtmp'));

mergeDefault(proto, require('./node'));

mergeDefault(proto, require('./common/client'));

mergeDefault(proto, require('./common/multipart/index'));

mergeDefault(proto, require('./node/client/index'));

mergeDefault(proto, require('./node/multipart/multipartUpload'));

mergeDefault(proto, require('./node/utils'));

mergeDefault(proto, require('./common/utils'));

mergeDefault(proto, require('./common/object'));

/**
 * ImageClient class
 */
Client.ImageClient = require('./image')(Client);
/**
 * Cluster Client class
 */
Client.ClusterClient = require('./cluster')(Client);

/**
 * STS Client class
 */
Client.STS = require('./sts');