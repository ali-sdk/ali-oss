import urllib from 'urllib';
import AgentKeepalive from 'agentkeepalive';
import { _getUserAgent } from './common/client/_getUserAgent';
import { initOptions } from './common/client/initOptions';
import base from './common/client';
import { _unSupportBrowserTip } from './common/utils/_unSupportBrowserTip';
import { _createStream } from './browser/client/_createStream';
import { IOptions } from './types/params';

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

  public constructor(options: IOptions, ctx?) {
    _unSupportBrowserTip();

    if (!Client.prototype._createStream) {
      Client.prototype._createStream = _createStream;
    }

    Object.keys(base).forEach(prop => {
      Client.prototype[prop] = base[prop];
    });

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

  setConfig(options: IOptions & { inited?: true }, ctx) {
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
    this.userAgent = _getUserAgent();
  }
}


export const initClient = (options: IOptions, ctx?) => {
  return new Client(options, ctx);
};

export {
  Client
};
