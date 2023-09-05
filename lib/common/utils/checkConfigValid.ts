const checkConfigMap = {
  endpoint: checkEndpoint,
  region: /^[a-zA-Z0-9\-_]+$/
};

function checkEndpoint(endpoint) {
  if (typeof endpoint === 'string') {
    return /^[a-zA-Z0-9._:/-]+$/.test(endpoint);
  } else if (endpoint.host) {
    return /^[a-zA-Z0-9._:/-]+$/.test(endpoint.host);
  }
  return false;
}

export const checkConfigValid = (conf, key: 'endpoint' | 'region'): void => {
  if (checkConfigMap[key]) {
    let isConfigValid = true;
    if (checkConfigMap[key] instanceof Function) {
      isConfigValid = (checkConfigMap[key] as Function)(conf);
    } else {
      isConfigValid = (checkConfigMap[key] as RegExp).test(conf);
    }
    if (!isConfigValid) {
      throw new Error(`The ${key} must be conform to the specifications`);
    }
  }
};
