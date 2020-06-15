import { getReqUrl } from './getReqUrl';

export function objectUrl(name, options) {
  return getReqUrl({ bucket: options.bucket, object: name }, options);
}
