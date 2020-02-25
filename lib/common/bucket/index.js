const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./getBucketRequestPayment'));
merge(proto, require('./putBucketRequestPayment'));
merge(proto, require('./putBucketEncryption'));
merge(proto, require('./getBucketEncryption'));
merge(proto, require('./deleteBucketEncryption'));
merge(proto, require('./getBucketTags'));
merge(proto, require('./putBucketTags'));
merge(proto, require('./deleteBucketTags'));
merge(proto, require('./getBucketLifecycle'));
merge(proto, require('./putBucketLifecycle'));
merge(proto, require('./deleteBucketLifecycle'));
