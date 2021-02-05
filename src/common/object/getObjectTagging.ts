import { objectName } from '../utils/objectName';
import { formatTag } from '../utils/formatTag';
import { parseXML } from '../utils/parseXML';
import { MultiVersionCommonOptions, NormalSuccessResponseWithStatus } from '../../types/params';
import { _objectRequestParams } from '../client/_objectRequestParams';
import { Client } from '../../setConfig';
/**
 * getObjectTagging
 * @param {String} name - object name
 * @param {Object} options
 * @return {Object}
 */

export async function getObjectTagging(this: Client, name: string, options: MultiVersionCommonOptions = {}) {
  options.subres = Object.assign({ tagging: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  name = objectName(name);
  const params = _objectRequestParams.call(this, 'GET', name, options);
  params.successStatuses = [200];
  const result: NormalSuccessResponseWithStatus & { data: any } = await this.request(params);
  const Tagging = await parseXML(result.data);

  return {
    status: result.status,
    res: result.res,
    tag: formatTag(Tagging)
  };
}

