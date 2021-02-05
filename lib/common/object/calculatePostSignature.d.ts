import { Client } from '../../setConfig';
/**
 * @param {Object or JSON} policy specifies the validity of the fields in the request.
 * @return {Object} params
 *         {String} params.OSSAccessKeyId
 *         {String} params.Signature
 *         {String} params.policy JSON text encoded with UTF-8 and Base64.
 */
export declare function calculatePostSignature(this: Client, policy: object | string): {
    OSSAccessKeyId: string;
    Signature: string;
    policy: string;
};
