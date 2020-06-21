import urllib from 'urllib';
import AgentKeepalive from 'agentkeepalive';
import { getUserAgent } from './common/utils/getUserAgent';
import { initOptions } from './common/client/initOptions';
import base from './common/client'

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

  public constructor(options, ctx) {
    if (!(this instanceof Client)) {
      return new Client(options, ctx);
    }

    Object.keys(base).map(prop => {
      Client.prototype[prop] = base[prop]
    })

    this.setConfig(options, ctx);
  }

  use(fn: Function) {
    if(typeof fn === 'function') {
      this[fn.name] = fn.bind(this);
      Client.prototype[fn.name] = fn;
      return this[fn.name]
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


export const setConfig = (options, ctx) => {
  return new Client(options, ctx);
};

export {
  Client
};
