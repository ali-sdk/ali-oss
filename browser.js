/*
 * Export `OSS` as standalone lib which can be used in browser
 *
 * Use browserify:
 *  browserify browser.js --standalone OSS > ali-oss-sdk.js
 *
 * @example
 * <script type="text/javascript" src="ali-oss-sdk.js"></script>
 * <script type="text/javascript">
 *   var oss = new OSS(options);
 *   OSS.co(function* () {
 *     var result = oss.list({
 *       'max-keys': 10
 *     });
 *     console.log(result);
 *   }).then(function () {
 *     // pass
 *   }).catch(function (err) {
 *     console.log(err);
 *   });
 * </script>
 */

var OSS = require('.');
OSS.co = require('co');
OSS.urllib = require('urllib');

module.exports = OSS;
