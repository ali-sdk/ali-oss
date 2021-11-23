const utils = require('./utils');
const config = require('../config').oss;
const OSS = require('../..');

const store = new OSS(config);
utils.cleanAllBucket(store);
