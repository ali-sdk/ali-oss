const { checkValid } = require('./checkValid');
const { isObject } = require('./isObject');

const commonRules = [
  {
    validator: value => {
      if (typeof value !== 'string') {
        throw new Error('the key and value of the tag must be String');
      }
    }
  }
];

const rules = {
  key: [
    ...commonRules,
    {
      pattern: /^.{1,64}$/,
      msg: 'tag key can be a maximum of 64 bytes in length'
    },
    {
      pattern: /^(?!https*:\/\/|Aliyun)/,
      msg: 'tag key can not startsWith: http://, https://, Aliyun'
    }
  ],
  value: [
    ...commonRules,
    {
      pattern: /^.{0,128}$/,
      msg: 'tag value can be a maximum of 128 bytes in length'
    }
  ]
};

export const checkBucketTag = (tag: object) => {
  if (!isObject(tag)) {
    throw new Error('bucket tag must be Object');
  }

  const entries = Object.entries(tag);

  if (entries.length > 20) {
    throw new Error('maximum of 20 tags for a bucket');
  }

  const rulesIndexKey = ['key', 'value'];
  entries.forEach(keyValue => {
    keyValue.forEach((item, index) => {
      checkValid(item, rules[rulesIndexKey[index]]);
    });
  });
};
