import utility from 'utility';

const _defaultConfig = {
  reg: /%2F/g,
  str: '/'
};

export function escapeName(name, config = _defaultConfig) {
  const { reg, str } = config;
  return utility.encodeURIComponent(name).replace(reg, str);
}
