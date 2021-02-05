import { Client } from '../../setConfig';
/**
 * Get Object url by name
 * @param {String} name - object name
 * @param {String} [baseUrl] - If provide `baseUrl`, will use `baseUrl` instead the default `endpoint and bucket`.
 * @return {String} object url include bucket
 */
export declare function generateObjectUrl(this: Client, name: string, baseUrl?: string): string;
