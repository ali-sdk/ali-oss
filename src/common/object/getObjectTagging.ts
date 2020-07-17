import { objectName } from '../utils/objectName';
import { formatTag } from '../utils/formatTag';
import { parseXML } from '../utils/parseXML';
/**
 * getObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 * @return {Object}
 */

export async function getObjectTagging(this: any, name: string, options: any = {}) {
  options.subres = Object.assign({ tagging: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = this._objectRequestParams('GET', name, options);
  params.successStatuses = [200];
  const result = await this.request(params);
  const Tagging = await parseXML(result.data);

  return {
    status: result.status,
    res: result.res,
    tag: formatTag(Tagging)
  };
}

