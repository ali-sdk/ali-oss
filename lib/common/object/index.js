const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./getSymlink'));
merge(proto, require('./putSymlink'));
merge(proto, require('./getObjectMeta'));
merge(proto, require('./getObjectTagging.js'));
merge(proto, require('./putObjectTagging.js'));
merge(proto, require('./deleteObjectTagging.js'));

