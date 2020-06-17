/* eslint-disable object-curly-newline */
import utility from 'utility';
import { obj2xml } from '../utils/obj2xml';
import { objectName } from '../utils/objectName';
import { objectRequestParams } from '../utils/objectRequestParams';

export async function deleteMulti(this: any, names, options: any = {}) {
  const objects: any[] = [];
  if (!names || !names.length) {
    throw new Error('names is required');
  }
  for (let i = 0; i < names.length; i++) {
    const object: any = {};
    if (typeof names[i] === 'string') {
      object.Key = utility.escape(objectName(names[i]));
    } else {
      const { key, versionId } = names[i];
      object.Key = utility.escape(objectName(key));
      object.VersionId = versionId;
    }
    objects.push(object);
  }

  const paramXMLObj = {
    Delete: {
      Quiet: !!options.quiet,
      Object: objects
    }
  };

  const paramXML = obj2xml(paramXMLObj, {
    headers: true
  });

  options.subres = Object.assign({ delete: '' }, options.subres);
  if (options.versionId) {
    options.subres.versionId = options.versionId;
  }
  const params = objectRequestParams('POST', '', this.options.bucket, options);
  params.mime = 'xml';
  params.content = paramXML;
  params.xmlResponse = true;
  params.successStatuses = [200];
  const result = await this.request(params);

  const r = result.data;
  let deleted = (r && r.Deleted) || null;
  if (deleted) {
    if (!Array.isArray(deleted)) {
      deleted = [deleted];
    }
  }
  return {
    res: result.res,
    deleted: deleted || []
  };
};
