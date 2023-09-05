import copy from 'copy-to';
import urlutil from 'url';
import merge from 'merge-descriptors';
import is from 'is-type-of';
import { isIP } from '../utils/isIP';
import { checkConfigValid } from '../utils/checkConfigValid';

export function getReqUrl(this: any, params) {
  const ep: any = {};
  const isCname = this.options.cname;
  checkConfigValid(this.options.endpoint, 'endpoint');
  copy(this.options.endpoint, false).to(ep);

  if (params.bucket && !isCname && !isIP(ep.hostname) && !this.options.sldEnable) {
    ep.host = `${params.bucket}.${ep.host}`;
  }

  let resourcePath = '/';
  if (params.bucket && this.options.sldEnable) {
    resourcePath += `${params.bucket}/`;
  }

  if (params.object) {
    // Preserve '/' in result url
    resourcePath += this._escape(params.object).replace(/\+/g, '%2B');
  }
  ep.pathname = resourcePath;

  const query = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    let subresAsQuery = {};
    if ((is as any).string(params.subres)) {
      subresAsQuery[params.subres] = '';
    } else if (is.array(params.subres)) {
      params.subres.forEach(k => {
        subresAsQuery[k] = '';
      });
    } else {
      subresAsQuery = params.subres;
    }
    merge(query, subresAsQuery);
  }

  ep.query = query;

  return urlutil.format(ep);
}
