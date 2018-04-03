var OSS = require('./browser/client');
OSS.Buffer = require('buffer').Buffer;
OSS.co = require('co');
OSS.urllib = require('../shims/xhr');

module.exports = OSS;
