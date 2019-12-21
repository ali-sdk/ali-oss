const obj2xml = require('../utils/obj2xml.js');

const proto = exports;
/**
 * putObjectTagging
 * @param {Sting} name - object name
 * @param {Object} tag -  object tag, eg: `{a: "1", b: "2"}`
 * @param {Object} options
 */

const commonRules = [
  {
    validator: (value) => {
      if (typeof value !== 'string') {
        throw new Error('the key and value of the tag must be String');
      }
    }
  },
  {
    pattern: /^[a-zA-Z0-9 +-=._:/]+$/,
    msg: 'tag can contain letters, numbers, spaces, and the following symbols: plus sign (+), hyphen (-), equal sign (=), period (.), underscore (_), colon (:), and forward slash (/)'
  }
];

const rules = {
  key: [
    ...commonRules,
    {
      pattern: /^.{1,128}$/,
      msg: 'tag key can be a maximum of 128 bytes in length'
    }
  ],
  value: [
    ...commonRules,
    {
      pattern: /^.{0,256}$/,
      msg: 'tag value can be a maximum of 256 bytes in length'
    }
  ]
};

function checkValid(_value, _rules) {
  _rules.forEach((rule) => {
    if (rule.validator) {
      rule.validator(_value);
    } else if (rule.pattern && !rule.pattern.test(_value)) {
      throw new Error(rule.msg);
    }
  });
}

proto.putObjectTagging = async function putObjectTagging(name, tag, options = {}) {
  this._checkTag(tag);

  options.subres = 'tagging';
  name = this._objectName(name);
  const params = this._objectRequestParams('PUT', name, options);
  params.successStatuses = [200];
  tag = Object.keys(tag).map(key => ({
    Key: key,
    Value: tag[key]
  }));

  const paramXMLObj = {
    Tagging: {
      TagSet: {
        Tag: tag
      }
    }
  };

  params.mime = 'xml';
  params.content = obj2xml(paramXMLObj);

  const result = await this.request(params);
  return {
    res: result.res,
    status: result.status
  };
};


proto._checkTag = function checkTag(tag) {
  if (Object.prototype.toString.call(tag) !== '[object Object]') {
    throw new Error('tag must be Object');
  }

  const entries = Object.entries(tag);
  const rulesIndexKey = ['key', 'value'];

  entries.forEach((keyValue) => {
    keyValue.forEach((item, index) => {
      checkValid(item, rules[rulesIndexKey[index]]);
    });
  });
};
