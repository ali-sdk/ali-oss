import urlutil from 'url';
import copy from 'copy-to';
import merge from 'merge-descriptors';
import is from 'is-type-of';
import { isIP } from '../utils/isIP';
import { escapeName } from '../utils/escapeName';

export function _getReqUrl(this: any, params) {
  const _escape = this._escape || escapeName;
  const ep: any = {};
  copy(this.options.endpoint).to(ep);
  const _isIP = isIP(ep.hostname);
  const isCname = this.options.cname;

  if (params.bucket && !isCname && !_isIP && !this.options.sldEnable) {
    ep.host = `${params.bucket}.${ep.host}`;
  }

  let resourcePath = '/';
  if (params.bucket && (this.options.sldEnable || _isIP)) {
    resourcePath += `${params.bucket}/`;
  }

  if (params.object) {
    // Preserve '/' in result url
    resourcePath += _escape(params.object).replace(/\+/g, '%2B');
  }
  ep.pathname = resourcePath;

  const query: any = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    let subresAsQuery = {};
    if (is.string(params.subres)) {
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
