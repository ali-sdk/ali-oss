export function checkValid(_value: any, _rules: Array<{ validator?: Function, pattern?: RegExp, msg?: string }>) {
  _rules.forEach((rule) => {
    if (rule.validator) {
      rule.validator(_value);
    } else if (rule.pattern && !rule.pattern.test(_value)) {
      throw new Error(rule.msg);
    }
  });
}

export function checkValidEndpoint(value) {
  return checkValid(value, [{
    validator: function checkEndpoint(endpoint) {
      let isValid = true;
      if (typeof endpoint === 'string') {
        isValid = /^[a-zA-Z0-9._:/-]+$/.test(endpoint);
      } else if (endpoint.host) {
        isValid = /^[a-zA-Z0-9._:/-]+$/.test(endpoint.host);
      }
      if (!isValid) {
        throw new Error('The endpoint must be conform to the specifications');
      }
    }
  }]);
}

export function checkValidRegion(value) {
  return checkValid(value, [{
    pattern: /^[a-zA-Z0-9\-_]+$/,
    msg: 'The region must be conform to the specifications'
  }, {
    pattern: /oss-/,
    msg: 'The region must be conform to the specifications'
  }
  ]);
}
