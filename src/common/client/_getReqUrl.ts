import urlutil from 'url';
import copy from 'copy-to';
import merge from 'merge-descriptors';
import { isIP } from '../utils/isIP';
import { checkValidEndpoint } from '../utils/checkValid';
import { escapeName } from '../utils/escapeName';
import { Client } from '../../setConfig';
import { isString } from '../utils/isString';
import { isArray } from '../utils/isArray';

export function _getReqUrl(this: Client, params) {
  const ep: any = {};
  checkValidEndpoint(this.options.endpoint);
  copy(this.options.endpoint).to(ep);
  const _isIP = isIP(ep.hostname);
  const isCname = this.options.cname;

  if (params.bucket && !isCname && !_isIP && !this.options.sldEnable) {
    ep.host = `${params.bucket}.${ep.host}`;
  }

  let resourcePath = '/';
  if (params.bucket && this.options.sldEnable) {
    resourcePath += `${params.bucket}/`;
  }

  if (params.object) {
    // Preserve '/' in result url
    resourcePath += escapeName(params.object).replace(/\+/g, '%2B');
  }
  ep.pathname = resourcePath;

  const query: any = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    let subresAsQuery = {};
    if (isString(params.subres)) {
      subresAsQuery[params.subres] = '';
    } else if (isArray(params.subres)) {
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
