import { Client } from '../../setConfig';
/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint`.
 * @return {String} object url
 */
export declare function getObjectUrl(this: Client, name: string, baseUrl?: string): string;
