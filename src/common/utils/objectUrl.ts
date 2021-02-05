import { Client } from '../../setConfig';
import { getReqUrl } from './getReqUrl';

export function objectUrl(this: Client | any, name: string, options?) {
  options = options || this.options;
  return getReqUrl({ bucket: options.bucket, object: name }, options);
}
