const merge = require('merge-descriptors');

const proto = exports;

merge(proto, require('./getSymlink'));
merge(proto, require('./putSymlink'));
merge(proto, require('./getObjectMeta'));
merge(proto, require('./copyObject'));
merge(proto, require('./calculatePostSignature'));
merge(proto, require('./getObjectTagging'));
merge(proto, require('./putObjectTagging'));
merge(proto, require('./deleteObjectTagging'));
merge(proto, require('./getBucketVersions'));
merge(proto, require('./deleteMulti'));
merge(proto, require('./getACL'));
merge(proto, require('./putACL'));
merge(proto, require('./head'));
merge(proto, require('./delete'));
merge(proto, require('./get'));
merge(proto, require('./postAsyncFetch'));
merge(proto, require('./getAsyncFetch'));
merge(proto, require('./generateObjectUrl'));
merge(proto, require('./getObjectUrl'));
merge(proto, require('./signatureUrl'));
merge(proto, require('./asyncSignatureUrl'));
merge(proto, require('./signatureUrlV4'));
