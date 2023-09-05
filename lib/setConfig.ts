import urllib from 'urllib';
import AgentKeepalive from 'agentkeepalive';
import { getUserAgent } from './common/utils/getUserAgent';
import initOptions from './common/client/initOptions';

const HttpsAgentKeepalive = AgentKeepalive.HttpsAgent;
const globalHttpAgent = new AgentKeepalive();
const globalHttpsAgent = new HttpsAgentKeepalive();

class Client {
  options;

  urllib;

  agent;

  httpsAgent;

  ctx;

  userAgent;

  constructor(options, ctx) {
    if (!(this instanceof Client)) {
      return new Client(options, ctx);
    }

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

let client;
export const setConfig = (options, ctx) => {
  client = new Client(options, ctx);
};

export { client };
