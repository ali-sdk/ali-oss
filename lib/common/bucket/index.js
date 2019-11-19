const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./getBucketRequestPayment.js'));
merge(proto, require('./putBucketRequestPayment.js'));

