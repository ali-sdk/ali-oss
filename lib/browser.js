const OSS = require('./browser/client');
OSS.Buffer = require('buffer').Buffer;
OSS.co = require('co');
OSS.urllib = require('../shims/xhr');
OSS.version = require('./browser/version').version;

module.exports = OSS;
