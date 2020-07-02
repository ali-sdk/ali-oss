import { Client } from '../setConfig';

import commonObject from '../common/object';
import commonMultipart from '../common/multipart';
import commonUtils from '../common/utils';
import commonImage from '../common/image';
import commonBucket from '../common/bucket';
import commonClient from '../common/client';

import object from './object';
import client from './client';
import multipart from './multipart';
import utils from './utils';

import rtmp from './rtmp';
import sts from './sts';
import cluster from './cluster';

function initClientProto(protos) {
  Object.keys(protos).map(prop => {
    Client.prototype[prop] = protos[prop];
  });
}

const OSS: any = Client;

initClientProto(commonObject);
initClientProto(commonMultipart);
initClientProto(commonUtils);
initClientProto(commonImage);
initClientProto(commonBucket);
initClientProto(commonClient);

initClientProto(object);
initClientProto(client);
initClientProto(multipart);
initClientProto(utils);
initClientProto(rtmp);

module.exports = OSS;
OSS.STS = sts;
OSS.ClusterClient = cluster(OSS);
