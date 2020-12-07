import is from 'is-type-of';
import copy from 'copy-to';
import urlutil from 'url';
import merge from 'merge-descriptors';
import { isIP } from './isIP';
import { escapeName } from './escapeName';
import { checkValidEndpoint } from "./checkValid";

export function getReqUrl(params, options) {
  const ep: any = {};
  checkValidEndpoint(options.endpoint);
  copy(options.endpoint, false).to(ep);
  const _isIP = isIP(ep.hostname);
  const isCname = options.cname;
  if (params.bucket && !isCname && !_isIP && !options.sldEnable) {
    ep.host = `${params.bucket}.${ep.host}`;
  }

  let resourcePath = '/';
  if (params.bucket && options.sldEnable) {
    resourcePath += `${params.bucket}/`;
  }

  if (params.object) {
    // Preserve '/' in result url
    resourcePath += escapeName(params.object).replace(/\+/g, '%2B');
  }
  ep.pathname = resourcePath;

  const query = {};
  if (params.query) {
    merge(query, params.query);
  }

  if (params.subres) {
    let subresAsQuery = {};
    if (is.string(params.subres)) {
      subresAsQuery[params.subres] = '';
    } else if (is.array(params.subres)) {
      params.subres.forEach((k) => {
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
