const sinon = require('sinon');
const assert = require('assert');
const signHelper = require('../../lib/common/signUtils');
const { oss: config } = require('../config');
const OSS = require('../..');
const dateFormat = require('dateformat');

const cloudBoxId = 'cloudBoxId-test';

/**
 *
 * @param {boolean} isCloudBox
 */
function getProductAndSignRegion(isCloudBox) {
  if (isCloudBox) return { product: 'oss-cloudbox', signRegion: cloudBoxId };
  return { product: 'oss', signRegion: config.region.slice(4) };
}

describe('signature v4 should support cloudbox', () => {
  const bucket = 'cloud-box-test';
  const date = new Date();
  const formattedDate = dateFormat(date, "UTC:yyyymmdd'T'HHMMss'Z'");
  const onlyDate = formattedDate.split('T')[0];
  [true, false].forEach(isCloudBox => {
    const { product, signRegion } = getProductAndSignRegion(isCloudBox);
    it(`should signatureUrlV4 support ${isCloudBox ? 'cloudBox' : 'publicCloud'}`, async () => {
      const getProductSpy = sinon.spy(signHelper, 'getProductName'); // (cloudBoxId)
      sinon.spy(signHelper, 'getCredential'); // (onlyDate, signRegion, this.options.accessKeyId, product)
      const getStringToSignSpy = sinon.spy(signHelper, 'getStringToSign'); // (signRegion, formattedDate, canonicalRequest, product)
      const getSignatureV4Spy = sinon.spy(signHelper, 'getSignatureV4'); // (this.options.accessKeySecret, onlyDate, signRegion, stringToSign, product)
      const store = isCloudBox
        ? new OSS({ ...config, cloudBoxId, bucket })
        : new OSS({ ...config, cloudBoxId: undefined, bucket });
      await store.signatureUrlV4(
        'GET',
        600,
        {
          headers: {
            'cache-control': 'no-cache'
          }
        },
        'cloud-box-test-object',
        ['cache-control']
      );
      //  console.log("###:",getProductSpy.args);
      // test getProduct
      assert.strictEqual(getProductSpy.calledWithExactly(store.options.cloudBoxId), true);
      assert.strictEqual(getProductSpy.returnValues[0], product);
      // first call getCredential in signatureUrlV4
      const getCredential0 = signHelper.getCredential.getCall(0);
      assert.deepStrictEqual(getCredential0.args, [onlyDate, signRegion, store.options.accessKeyId, product]);
      assert.strictEqual(
        getCredential0.returnValue,
        `${store.options.accessKeyId}/${onlyDate}/${signRegion}/${product}/aliyun_v4_request`
      );
      // second call getCredential in getStringToSign
      const getCredential1 = signHelper.getCredential.getCall(1);
      const credential = `${onlyDate}/${signRegion}/${product}/aliyun_v4_request`;
      assert.deepStrictEqual(getCredential1.args, [onlyDate, signRegion, undefined, product]);
      assert.strictEqual(getCredential1.returnValue, credential);
      // test getStringToSign
      assert.deepStrictEqual(
        [...getStringToSignSpy.args[0].slice(0, 2), getStringToSignSpy.args[0][3]],
        [signRegion, formattedDate, product]
      );
      const stringToSign = getStringToSignSpy.returnValues[0];
      assert.deepStrictEqual(stringToSign.split('\n').slice(0, 3), ['OSS4-HMAC-SHA256', formattedDate, credential]);
      // test getSignatureV4
      assert.deepStrictEqual(getSignatureV4Spy.args[0], [
        store.options.accessKeySecret,
        onlyDate,
        signRegion,
        stringToSign,
        product
      ]);
      sinon.restore();
    });
    it(`should authorizationV4 support  ${isCloudBox ? 'cloudBox' : 'publicCloud'}`, async () => {
      const getProductSpy = sinon.spy(signHelper, 'getProductName'); // (cloudBoxId)
      sinon.spy(signHelper, 'getCredential'); // (onlyDate, signRegion, this.options.accessKeyId, product)
      const getStringToSignSpy = sinon.spy(signHelper, 'getStringToSign'); // (signRegion, formattedDate, canonicalRequest, product)
      const getSignatureV4Spy = sinon.spy(signHelper, 'getSignatureV4'); // (this.options.accessKeySecret, onlyDate, signRegion, stringToSign, product)
      const store = isCloudBox
        ? new OSS({ ...config, cloudBoxId, bucket, authorizationV4: true })
        : new OSS({ ...config, cloudBoxId: undefined, bucket, authorizationV4: true });
      try {
        await store.put('test-object', __filename);
      } catch (e) {
        // console.log(e);
      }
      assert.strictEqual(getProductSpy.calledWithExactly(store.options.cloudBoxId), true);
      assert.strictEqual(getProductSpy.returnValues[0], product);
      // first call getCredential in getStringToSign
      const getCredential0 = signHelper.getCredential.getCall(0);
      const credential = `${onlyDate}/${signRegion}/${product}/aliyun_v4_request`;
      assert.deepStrictEqual(getCredential0.args, [onlyDate, signRegion, undefined, product]);
      assert.strictEqual(getCredential0.returnValue, credential);
      // second call getCredential in signatureUrlV4
      const getCredential1 = signHelper.getCredential.getCall(1);
      assert.deepStrictEqual(getCredential1.args, [onlyDate, signRegion, store.options.accessKeyId, product]);
      assert.strictEqual(
        getCredential1.returnValue,
        `${store.options.accessKeyId}/${onlyDate}/${signRegion}/${product}/aliyun_v4_request`
      );

      // test getStringToSign
      assert.deepStrictEqual(
        [...getStringToSignSpy.args[0].slice(0, 2), getStringToSignSpy.args[0][3]],
        [signRegion, formattedDate, product]
      );
      const stringToSign = getStringToSignSpy.returnValues[0];
      assert.deepStrictEqual(stringToSign.split('\n').slice(0, 3), ['OSS4-HMAC-SHA256', formattedDate, credential]);
      // test getSignatureV4
      assert.deepStrictEqual(getSignatureV4Spy.args[0], [
        store.options.accessKeySecret,
        onlyDate,
        signRegion,
        stringToSign,
        product
      ]);
      sinon.restore();

      // test getProduct
      // assert.strictEqual(getProductSpy.calledWithExactly(store.options.cloudBoxId), true);
      // assert.strictEqual(getProductSpy.returnValues[0],product);
      // // first call getCredential in signatureUrlV4
      // const getCredential0=signHelper.getCredential.getCall(0);
      // assert.deepStrictEqual(getCredential0.args,[onlyDate,signRegion,store.options.accessKeyId,product])
      // assert.strictEqual(getCredential0.returnValue,`${store.options.accessKeyId}/${onlyDate}/${signRegion}/${product}/aliyun_v4_request`)
      // // second call getCredential in getStringToSign
      // const getCredential1=signHelper.getCredential.getCall(1);
      // const credential=`${onlyDate}/${signRegion}/${product}/aliyun_v4_request`
      // assert.deepStrictEqual(getCredential1.args,[onlyDate,signRegion,undefined,product])
      // assert.strictEqual(getCredential1.returnValue,credential)
      // // test getStringToSign
      // assert.deepStrictEqual([...getStringToSignSpy.args[0].slice(0,2),getStringToSignSpy.args[0][3]],[signRegion, formattedDate,product])
      // const stringToSign=getStringToSignSpy.returnValues[0];
      // assert.deepStrictEqual(stringToSign.split("\n").slice(0,3),["OSS4-HMAC-SHA256",formattedDate,credential])
      // //test getSignatureV4
      // assert.deepStrictEqual(getSignatureV4Spy.args[0],[store.options.accessKeySecret,onlyDate,signRegion,stringToSign,product])
      // sinon.restore();
    });
  });
});
