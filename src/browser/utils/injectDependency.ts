import { put } from '../object/put';
import { isCancel } from '../../common/client';
import { uploadPart } from '../multipart/uploadPart';
import { completeMultipartUpload } from '../../common/multipart/completeMultipartUpload';
import { OSS } from '../core';

const Dependencies = {
  multipartUpload: {
    put,
  },
  resumeMultipart: {
    isCancel,
    uploadPart,
    completeMultipartUpload
  }
};

export function injectDependency(ctx: OSS, name: keyof typeof Dependencies) {
  const dependencies = Dependencies[name];
  if (!dependencies) return;
  Object.keys(dependencies).forEach(attibute => {
    if (ctx[attibute]) return;
    const mayBeNestedMethod = dependencies[attibute];
    if (typeof mayBeNestedMethod === 'function') {
      ctx[attibute] = mayBeNestedMethod;
    }
  });
}
