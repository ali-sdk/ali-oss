import utility from 'utility';
import copy from 'copy-to';
import urlutil from 'url';
import { objectName } from '../../common/utils/objectName';
import { getResource } from '../../common/utils/getResource';
import { _signatureForURL } from '../../common/utils/signUtils';
import { getReqUrl } from '../../common/utils/getReqUrl';

export function signatureUrl(this: any, name, options) {
  options = options || {};
  name = objectName(name);
  options.method = options.method || 'GET';
  const expires = utility.timestamp() + (options.expires || 1800);
  const params = {
    bucket: this.options.bucket,
    object: name
  };

  const resource = getResource(params);

  if (this.options.stsToken) {
    options['security-token'] = this.options.stsToken;
  }

  const signRes = _signatureForURL(this.options.accessKeySecret, options, resource, expires);

  const url: any = urlutil.parse(getReqUrl(params, this.options));
  url.query = {
    OSSAccessKeyId: this.options.accessKeyId,
    Expires: expires,
    Signature: signRes.Signature
  };

  copy(signRes.subResource).to(url.query);

  return url.format();
};