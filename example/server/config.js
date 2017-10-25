var env = process.env;
module.exports = {
  AccessKeyId: env.ALI_SDK_STS_ID,
  AccessKeySecret: env.ALI_SDK_STS_SECRET,
  RoleArn: env.ALI_SDK_STS_ROLE,
  TokenExpireTime : "900",
  PolicyFile: "policy/all_policy.txt"
}