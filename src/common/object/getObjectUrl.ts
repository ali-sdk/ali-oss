import { objectName } from '../utils/objectName';
import { escapeName } from '../utils/escapeName';

/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint`.
 * @return {String} object url
 */

export function getObjectUrl(this: any, name: string, baseUrl: any) {
  if (!baseUrl) {
    baseUrl = this.options.endpoint.format();
  } else if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl += '/';
  }
  return baseUrl + escapeName(objectName(name));
}
