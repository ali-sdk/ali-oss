const { env } = process;

const config = module.exports;

config.oss = {
  accessKeyId: env.ALI_SDK_OSS_ID,
  accessKeySecret: env.ALI_SDK_OSS_SECRET,
  region: env.ALI_SDK_OSS_REGION || 'oss-cn-hangzhou',
  endpoint: env.ONCI ? 'https://oss-us-west-1.aliyuncs.com' : null
};

config.sts = {
  accessKeyId: env.ALI_SDK_STS_ID,
  accessKeySecret: env.ALI_SDK_STS_SECRET,
  roleArn: env.ALI_SDK_STS_ROLE,
  bucket: env.ALI_SDK_STS_BUCKET,
  endpoint: env.ONCI ? 'https://sts.aliyuncs.com/' : null
};

config.metaSyncTime = env.ONCI ? '30s' : '1000ms';
