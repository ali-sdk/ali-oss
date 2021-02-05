"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.putBucketRequestPayment = void 0;
const checkBucketName_1 = require("../utils/checkBucketName");
const obj2xml_1 = require("../utils/obj2xml");
const _bucketRequestParams_1 = require("../client/_bucketRequestParams");
/**
 * putBucketRequestPayment
 * @param {String} bucketName
 * @param {String} payer
 * @param {Object} options
 */
const payerAll = ['BucketOwner', 'Requester'];
async function putBucketRequestPayment(bucketName, payer, options = {}) {
    if (!payer || payerAll.indexOf(payer) < 0) {
        throw new Error('payer must be BucketOwner or Requester');
    }
    checkBucketName_1.checkBucketName(bucketName);
    const params = _bucketRequestParams_1._bucketRequestParams('PUT', bucketName, 'requestPayment', options);
    params.successStatuses = [200];
    const paramXMLObj = {
        RequestPaymentConfiguration: {
            Payer: payer
        }
    };
    const paramXML = obj2xml_1.obj2xml(paramXMLObj, {
        headers: true
    });
    params.mime = 'xml';
    params.content = paramXML;
    const result = await this.request(params);
    return {
        status: result.status,
        res: result.res
    };
}
exports.putBucketRequestPayment = putBucketRequestPayment;
