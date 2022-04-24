"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anonymousAccessObject = void 0;
const urlutil = require('url');
async function anonymousAccessObject(target, opt) {
    const params = { acl: 'public-read' };
    if (!target)
        throw new Error('please enter your target');
    if (!target.bucketName && !this.options.bucket) {
        throw new Error("please initialization bucket name or anonymousAccess({object:'example-object',bucketName:'example-bucket'})");
    }
    if (target.bucketName)
        this.setBucket(target.bucketName);
    if (!target.object)
        throw new Error('please set object');
    params.name = target.object;
    if (target.acl)
        params.acl = target.acl;
    if (opt)
        params.option = opt;
    try {
        const res = await this.putACL(params.name, params.acl, params.option);
        if (res.res.statusCode === 200) {
            const url = urlutil.parse(this._getReqUrl({ bucket: this.options.bucket, object: params.name }));
            if (opt && opt.versionId)
                url.query = { versionId: opt.versionId };
            return url.format();
        }
        else {
            return res;
        }
    }
    catch (err) {
        throw new Error(err);
    }
}
exports.anonymousAccessObject = anonymousAccessObject;
