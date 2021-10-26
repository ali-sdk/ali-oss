const utils = require('./utils');
const config = require('../config').oss;
const oss = require('../..');

const store = oss(config);
utils.cleanAllBucket(store);
