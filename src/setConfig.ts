import urllib from 'urllib';
import AgentKeepalive from 'agentkeepalive';
import { _getUserAgent } from './common/client/_getUserAgent';
import { initOptions } from './common/client/initOptions';
import { request } from './common/client/request';
import { requestError } from './common/client/requestError';
import { _unSupportBrowserTip } from './common/utils/_unSupportBrowserTip';
import { IOptions } from './types/params';

import * as commonObject from './common/object';
import * as commonMultipart from './common/multipart';
import * as commonImage from './common/image';
import * as commonBucket from './common/bucket';
import * as commonClient from './common/client';

const HttpsAgentKeepalive = AgentKeepalive.HttpsAgent;
const globalHttpAgent = new AgentKeepalive();
const globalHttpsAgent = new HttpsAgentKeepalive();
class Client {

  protected _setOptions = 0;

  protected sendToWormhole?: Function;

  public options;

  public urllib;

  public agent;

  public httpsAgent;

  public ctx;

  public userAgent;

  public request = request;

  public requestError = requestError;

  public constructor(options: IOptions, ctx?) {
    this.setConfig(options, ctx);
  }

  static use(...fn: any) {
    if (Array.isArray(fn)) {
      fn.filter(_ => typeof _ === 'function').forEach(f => {
        Client.prototype[f.name] = f;
      });
    }
    return this;
  }

  static register(name: string, fn: Function) {
    if (!this.prototype[name]) {
      this.prototype[name] = fn;
    } else {
      console.warn(`ali-oss: ${name} has been registed`);
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

type ICommonObject = typeof commonObject;
type ICommonMultipart = typeof commonMultipart;
type ICommonImage = typeof commonImage;
type ICommonBucket = typeof commonBucket;
type ICommonClient = typeof commonClient;
interface Client extends ICommonBucket, ICommonMultipart, ICommonObject, ICommonImage, ICommonClient {
}

export const initClient = (options: IOptions, ctx?) => {
  return new Client(options, ctx);
};

export {
  Client
};
