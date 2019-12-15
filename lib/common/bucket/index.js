const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./getBucketRequestPayment.js'));
merge(proto, require('./putBucketRequestPayment.js'));
merge(proto, require('./putBucketEncryption.js'));
merge(proto, require('./getBucketEncryption.js'));
merge(proto, require('./deleteBucketEncryption.js'));
