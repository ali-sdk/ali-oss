import { obj2xml } from '../utils/obj2xml';
import { checkObjectTag } from '../utils/checkObjectTag';
import { objectName } from '../utils/objectName';
import { Tag, MultiVersionCommonOptions } from '../../types/params';

/**
 * putObjectTagging
 * @param {String} name - object name
 * @param {Object} tag -  object tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */

export async function putObjectTagging(this: any, name: string, tag: Tag, options: MultiVersionCommonOptions = {}) {
  checkObjectTag(tag);

  options.subres = Object.assign({ tagging: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];
  (tag as any) = Object.keys(tag).map(key => ({
    Key: key,
    Value: tag[key]
  }));

  const paramXMLObj = {
    Tagging: {
      TagSet: {
        Tag: tag
      }
    }
  };

  params.mime = 'xml';
  params.content = obj2xml(paramXMLObj);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
}
