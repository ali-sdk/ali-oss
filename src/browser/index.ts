import { OSS } from './core';

import * as commonObject from '../common/object';
import * as commonMultipart from '../common/multipart';
import * as commonImage from '../common/image';
import * as commonBucket from '../common/bucket';
import * as commonClient from '../common/client';

import * as object from './object';
import * as multipart from './multipart';

function initClientProto(protos) {
  Object.keys(protos).forEach(prop => {
    OSS.prototype[prop] = protos[prop];
  });
}

initClientProto(commonObject);
initClientProto(commonMultipart);
initClientProto(commonImage);
initClientProto(commonBucket);
initClientProto(commonClient);

initClientProto(object);
initClientProto(multipart);

type IObject = typeof object;
type IMultipart = typeof multipart;

declare module './core' {
  interface OSS extends IObject, IMultipart { }
}

export default OSS;
module.exports = OSS;
