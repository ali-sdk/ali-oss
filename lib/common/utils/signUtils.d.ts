/**
 *
 * @param {String} resourcePath
 * @param {Object} parameters
 * @return
 */
export declare function buildCanonicalizedResource(resourcePath: any, parameters: any): string;
/**
 * @param {String} method
 * @param {String} resourcePath
 * @param {Object} request
 * @param {String} expires
 * @return {String} canonicalString
 */
export declare function buildCanonicalString(method: any, resourcePath: any, request: any, expires?: any): string;
/**
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
export declare function computeSignature(accessKeySecret: any, canonicalString: any): string;
/**
 * @param {String} accessKeyId
 * @param {String} accessKeySecret
 * @param {String} canonicalString
 */
export declare function authorization(accessKeyId: any, accessKeySecret: any, canonicalString: any): string;
/**
 *
 * @param {String} accessKeySecret
 * @param {Object} options
 * @param {String} resource
 * @param {Number} expires
 */
export declare function _signatureForURL(accessKeySecret: any, options: any, resource: any, expires: any): {
    Signature: string;
    subResource: any;
};
