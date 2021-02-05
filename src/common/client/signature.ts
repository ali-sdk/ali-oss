import { Client } from '../../setConfig';
import { computeSignature } from '../utils/signUtils';

/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
export function signature(this: Client, stringToSign: string) {
  return computeSignature(this.options.accessKeySecret, stringToSign, this.options.headerEncoding);
}
