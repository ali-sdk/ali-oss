import urllib from 'urllib';
import AgentKeepalive from 'agentkeepalive';
import { getUserAgent } from './common/utils/getUserAgent';
import { initOptions } from './common/client/initOptions';
import base from './common/client';
import { _unSupportBrowserTip } from './common/utils/_unSupportBrowserTip';
import { _createStream } from './browser/client/_createStream';

const HttpsAgentKeepalive = AgentKeepalive.HttpsAgent;
const globalHttpAgent = new AgentKeepalive();
const globalHttpsAgent = new HttpsAgentKeepalive();

class Client {
  public options;

  public urllib;

  public agent;

  public httpsAgent;

  public ctx;

  public userAgent;

  public _createStream;

  public constructor(options, ctx) {
    if (!(this instanceof Client)) {
      return new Client(options, ctx);
    }
    _unSupportBrowserTip();

    Object.keys(base).forEach(prop => {
      Client.prototype[prop] = base[prop];
    });

    Client.prototype._createStream = _createStream;

    this.setConfig(options, ctx);
  }

  static use(...fn: any) {
    if (Array.isArray(fn)) {
      fn.filter(_ => typeof _ === 'function').forEach(f => {
        this[f.name] = f.bind(this);
        Client.prototype[f.name] = f;
      });
    }
    return this;
  }

  setConfig(options, ctx) {
    if (options && options.inited) {
      this.options = options;
    } else {
      this.options = initOptions(options);
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
    this.userAgent = getUserAgent();
  }
}


export const initClient = (options, ctx) => {
  return new Client(options, ctx);
};

export {
  Client
};
