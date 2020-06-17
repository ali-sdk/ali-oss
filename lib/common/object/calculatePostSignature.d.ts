/**
 * @param {Object or JSON} policy specifies the validity of the fields in the request.
 * @return {Object} params
 *         {String} params.OSSAccessKeyId
 *         {String} params.Signature
 *         {String} params.policy JSON text encoded with UTF-8 and Base64.
 */
export declare function calculatePostSignature(this: any, policy: any): {
    OSSAccessKeyId: any;
    Signature: string;
    policy: any;
};
