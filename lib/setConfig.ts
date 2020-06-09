import urllib from 'urllib';
import AgentKeepalive from 'agentkeepalive';
import { getUserAgent } from './common/utils/getUserAgent';

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

  public constructor(options) {
    if (!(this instanceof Client)) {
      return new Client(options);
    }

    if (options && options.inited) {
      this.options = options;
    } else {
      // this.options = Client.initOptions(options);
    }

    // support custom agent and urllib client
    if (this.options.urllib) {
      this.urllib = this.options.urllib;
    } else {
      this.urllib = urllib;
      this.agent = this.options.agent || globalHttpAgent;
      this.httpsAgent = this.options.httpsAgent || globalHttpsAgent;
    }
    // this.ctx = ctx;
    this.userAgent = getUserAgent();
  }
}

export const setConfig = (options) => {
  const client = new Client(options);
  console.log(client);
};
