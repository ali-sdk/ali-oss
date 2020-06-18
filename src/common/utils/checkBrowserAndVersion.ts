import bowser from 'bowser';
/*
 * Check Browser And Version
 * @param {String} [name] browser name: like IE, Chrome, Firefox
 * @param {String} [version] browser major version: like 10(IE 10.x), 55(Chrome 55.x), 50(Firefox 50.x)
 * @return {Bool} true or false
 * @api private
 */

export function checkBrowserAndVersion(name, version) {
  return ((bowser.name === name) && ((bowser as any).version.split('.')[0] === version));
};