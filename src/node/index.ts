import { Readable } from 'stream';
import { Client } from '../setConfig';

import * as commonObject from '../common/object';
import * as commonMultipart from '../common/multipart';
import * as commonImage from '../common/image';
import * as commonBucket from '../common/bucket';
import * as commonClient from '../common/client';

import object from './object';
import client from './client';
import multipart from './multipart';

import rtmp from './rtmp';
import sts from './sts';
import cluster from './cluster';

function initClientProto(protos) {
  Object.keys(protos).forEach(prop => {
    OSS.prototype[prop] = protos[prop];
  });
}
class OSS extends Client {
  static STS = sts;

  static ClusterClient = cluster(OSS);

  public multipartUploadStreams: Readable[] = [];

  // @ts-ignore
  protected sendToWormhole = client.sendToWormhole;
}

initClientProto(commonObject);
initClientProto(commonMultipart);
initClientProto(commonImage);
initClientProto(commonBucket);
initClientProto(commonClient);

initClientProto(object);
initClientProto(client);
initClientProto(multipart);
initClientProto(rtmp);

type IObject = typeof object;
type IMultipart = typeof multipart;
type IRtmp = typeof rtmp;
interface OSS extends IObject, IMultipart, IRtmp { }

export default OSS;
module.exports = OSS;
export * from '../types';
