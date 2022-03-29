import utility from 'utility';
import copy from 'copy-to';
import urlutil from 'url';
import { objectName } from '../../common/utils/objectName';
import { getResource } from '../../common/utils/getResource';
import { _signatureForURL } from '../../common/utils/signUtils';
import { getReqUrl } from '../../common/utils/getReqUrl';
import { signatureUrlOptions } from '../../types/params';
import { setSTSToken } from '../../common/utils/setSTSToken';
import { isFunction } from '../../common/utils/isFunction';

export async function signatureUrl(this: any, name: string, options: signatureUrlOptions = {}) {
  name = objectName(name);
  options.method = options.method || 'GET';
  const expires = (utility.timestamp() as number) + (options.expires || 1800);
  const params = {
    bucket: this.options.bucket,
    object: name
  };

  const resource = getResource(params, this.options.headerEncoding);

  if (this.options.stsToken && isFunction(this.options.refreshSTSToken)) {
    await setSTSToken.call(this);
  }

  if (this.options.stsToken) {
    options['security-token'] = this.options.stsToken;
  }

  const signRes = _signatureForURL(this.options.accessKeySecret, options, resource, expires);

  const url: any = urlutil.parse(getReqUrl(params, this.options));
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signRes.Signature.replace(/\+/g, '%2B')
  };

  copy(signRes.subResource).to(url.query);

  return url.format();
}
