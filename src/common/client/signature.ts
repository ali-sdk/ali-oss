import { computeSignature } from "../utils/signUtils";

/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
export function signature(this: any, stringToSign) {
  return computeSignature(this.options.accessKeySecret, stringToSign);
};
