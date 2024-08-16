const { cleanAllBucket } = require('../utils');
const { oss: config } = require('../../config');
const OSS = require('../../../lib/client');

// eslint-disable-next-line no-console
console.log(`cleanAllBucket...${new Date()}`);

const store = new OSS(config);
cleanAllBucket(store, 50, true);
