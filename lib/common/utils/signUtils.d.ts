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
export declare function computeSignature(accessKeySecret: string, canonicalString: string, headerEncoding?: any): string;
/**
 *
 * @param {String} accessKeySecret
 * @param {Object} options
 * @param {String} resource
 * @param {Number} expires
 */
export declare function _signatureForURL(accessKeySecret: any, options: any, resource: any, expires: any, headerEncoding?: any): {
    Signature: string;
    subResource: any;
};
declare const _default: {
    buildCanonicalizedResource: typeof buildCanonicalizedResource;
    buildCanonicalString: typeof buildCanonicalString;
    computeSignature: typeof computeSignature;
    _signatureForURL: typeof _signatureForURL;
};
export default _default;
