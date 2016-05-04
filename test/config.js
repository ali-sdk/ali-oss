var env = process.env;

var config = module.exports;

config.oss = {
  accessKeyId: env.ALI_SDK_OSS_ID,
  accessKeySecret: env.ALI_SDK_OSS_SECRET,
  endpoint: env.ALI_SDK_OSS_ENDPOINT,
  region: env.ALI_SDK_OSS_REGION || 'oss-cn-hangzhou',
  callbackServer: 'http://d.rockuw.com:4567'
};

config.sts = {
  accessKeyId: env.ALI_SDK_STS_ID,
  accessKeySecret: env.ALI_SDK_STS_SECRET,
  roleArn: env.ALI_SDK_STS_ROLE,
  bucket: env.ALI_SDK_STS_BUCKET,
  endpoint: env.TRAVIS ? 'https://sts.us-west-1.aliyuncs.com/' : null
};

config.metaSyncTime = env.TRAVIS ? '30s' : '10ms';
