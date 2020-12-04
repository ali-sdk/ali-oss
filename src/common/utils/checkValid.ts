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
      if (typeof endpoint === 'string') {
        return /^[a-zA-Z0-9._:/-]+$/.test(endpoint);
      } else if (endpoint.host) {
        return /^[a-zA-Z0-9._:/-]+$/.test(endpoint.host);
      }
      return false;
    }
  }]);
}

export function checkValidRegion(value) {
  return checkValid(value, [{
    pattern: /^[a-zA-Z0-9\-_]+$/
  }]);
}
