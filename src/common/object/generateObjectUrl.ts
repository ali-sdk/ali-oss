import urlutil from 'url';
import { objectName } from '../utils/objectName';
import { escapeName } from '../utils/escapeName';

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint and bucket`.
 * @return {String} object url include bucket
 */

export function generateObjectUrl(this: any, name: string, baseUrl?: string) {
  if (!baseUrl) {
    baseUrl = this.options.endpoint.format();
    const copyUrl: any = urlutil.parse((baseUrl as string));
    const { bucket } = this.options;

    copyUrl.hostname = `${bucket}.${copyUrl.hostname}`;
    copyUrl.host = `${bucket}.${copyUrl.host}`;
    baseUrl = copyUrl.format();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + escapeName(objectName(name));
}
