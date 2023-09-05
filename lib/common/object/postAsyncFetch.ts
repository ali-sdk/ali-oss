import { obj2xml } from '../utils/obj2xml';

/*
 * postAsyncFetch
 * @param {String} name the object key
 * @param {String} url
 * @param {Object} options
 *        {String} options.host
 *        {String} options.contentMD5
 *        {String} options.callback
 *        {String} options.storageClass Standard/IA/Archive
 *        {Boolean} options.ignoreSameKey  default value true
 */
export async function postAsyncFetch(this: any, object, url, options: any = {}): Promise<object> {
  options.subres = Object.assign({ asyncFetch: '' }, options.subres);
  options.headers = options.headers || {};
  object = this._objectName(object);

  const { host = '', contentMD5 = '', callback = '', storageClass = '', ignoreSameKey = true } = options;

  const paramXMLObj = {
    AsyncFetchTaskConfiguration: {
      Url: url,
      Object: object,
      Host: host,
      ContentMD5: contentMD5,
      Callback: callback,
      StorageClass: storageClass,
      IgnoreSameKey: ignoreSameKey
    }
  };

  const params = this._objectRequestParams('POST', '', options);
  params.mime = 'xml';
  params.xmlResponse = true;
  params.successStatuses = [200];
  params.content = obj2xml(paramXMLObj);

  const result = await this.request(params);

  return {
    res: result.res,
    status: result.status,
    taskId: result.data.TaskId
  };
}
