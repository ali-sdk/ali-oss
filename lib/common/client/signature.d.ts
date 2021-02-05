import { Client } from '../../setConfig';
/**
 * get OSS signature
 * @param {String} stringToSign
 * @return {String} the signature
 */
export declare function signature(this: Client, stringToSign: string): string;
