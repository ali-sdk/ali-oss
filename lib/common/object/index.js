const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./getSymlink'));
merge(proto, require('./putSymlink'));
merge(proto, require('./getObjectMeta'));
merge(proto, require('./copyObject.js'));

