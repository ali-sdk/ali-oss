const ms = require('humanize-ms');
const urlutil = require('url');
const { checkBucketName: _checkBucketName } = require('../utils/checkBucketName');
const { setRegion } = require('../utils/setRegion');
const { checkConfigValid } = require('../utils/checkConfigValid');

function setEndpoint(endpoint, secure) {
  checkConfigValid(endpoint, 'endpoint');
  let url = urlutil.parse(endpoint);

  if (!url.protocol) {
    url = urlutil.parse(`http${secure ? 's' : ''}://${endpoint}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Endpoint protocol must be http or https.');
  }

  return url;
}

module.exports = function (options) {
  if (!options || !options.accessKeyId || !options.accessKeySecret) {
    throw new Error('require accessKeyId, accessKeySecret');
  }
  if (options.stsToken && !options.refreshSTSToken) {
    console.warn(
      "It's recommended to set `refreshSTSToken` to refresh stsToken、accessKeyId、accessKeySecret automatically when sts info expires"
    );
  }
  if (options.bucket) {
    _checkBucketName(options.bucket);
  }
  const opts = Object.assign(
    {
      region: 'oss-cn-hangzhou',
      internal: false,
      secure: false,
      timeout: 60000,
      bucket: null,
      endpoint: null,
      cname: false,
      isRequestPay: false,
      sldEnable: false,
      headerEncoding: 'utf-8',
      refreshSTSToken: null,
      retryMax: 0
    },
    options
  );

  opts.accessKeyId = opts.accessKeyId.trim();
  opts.accessKeySecret = opts.accessKeySecret.trim();

  if (opts.timeout) {
    opts.timeout = ms(opts.timeout);
  }

  if (opts.endpoint) {
    opts.endpoint = setEndpoint(opts.endpoint, opts.secure);
  } else if (opts.region) {
    opts.endpoint = setRegion(opts.region, opts.internal, opts.secure);
  } else {
    throw new Error('require options.endpoint or options.region');
  }

  opts.inited = true;
  return opts;
};
