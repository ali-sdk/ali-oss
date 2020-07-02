import { getReqUrl } from './getReqUrl';

export function objectUrl(this: any, name: string, options?) {
  options = options || this.options
  return getReqUrl({ bucket: options.bucket, object: name }, options);
}
