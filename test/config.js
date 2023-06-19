const { env } = process;

const config = module.exports;
const USWEST = 'oss-us-west-1'; // ONCI 用美国硅谷的region速度会快些
console.log('config----', env, env.ALI_SDK_STS_BUCKET, env.ALI_SDK_STS_ROLE);
config.oss = {
  accessKeyId: env.ALI_SDK_OSS_ID,
  accessKeySecret: env.ALI_SDK_OSS_SECRET,
  accountId: env.ALI_SDK_STS_ROLE.match(/^acs:ram::(\d+):role/i)[1], // 通过roleRan获取主账号id
  region: env.ALI_SDK_OSS_REGION || 'oss-cn-hangzhou',
  endpoint: env.ONCI ? `https://${USWEST}.aliyuncs.com` : undefined
};

config.sts = {
  accessKeyId: env.ALI_SDK_STS_ID,
  accessKeySecret: env.ALI_SDK_STS_SECRET,
  roleArn: env.ALI_SDK_STS_ROLE,
  bucket: env.ALI_SDK_STS_BUCKET,
  endpoint: env.ONCI ? 'https://sts.aliyuncs.com/' : undefined
};

config.metaSyncTime = env.ONCI ? '30s' : '1000ms';
config.timeout = '120s';
