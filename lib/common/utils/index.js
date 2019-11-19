const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./obj2xml.js'));
merge(proto, require('./checkBucketName.js'));

